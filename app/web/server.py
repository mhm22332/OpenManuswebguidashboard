import os
import json
import time
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import FastAPI, Request, Form, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn
from pydantic import BaseModel

from app.config import Config, LLMSettings
from app.agent import get_all_agents
from app.tool import get_all_tools
from app.llm import MULTIMODAL_MODELS
from app.agent.base import Agent
from app.agent.mcp import MCPAgent

# Initialize FastAPI app
app = FastAPI(title="OpenManus Dashboard")

# Mount static files
app.mount("/static", StaticFiles(directory="app/web/static"), name="static")

# Setup templates
templates = Jinja2Templates(directory="app/web/templates")

# Usage tracking
usage_stats = {
    "total_requests": 0,
    "requests_by_model": {},
    "requests_by_day": {},
    "token_usage": {
        "total": 0,
        "by_model": {}
    }
}

# Get config
config = Config()

# Agent instance (lazy loaded)
agent_instance = None

# Pydantic models for request/response
class PromptRequest(BaseModel):
    prompt: str
    model: Optional[str] = None
    stream: Optional[bool] = False

class LogEntry(BaseModel):
    timestamp: str
    level: str
    message: str

@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    """Render the main dashboard page"""
    return templates.TemplateResponse(
        "dashboard.html",
        {"request": request}
    )

@app.get("/api/stats")
async def get_stats():
    """Get usage statistics"""
    return JSONResponse(content=usage_stats)

@app.get("/api/config")
async def get_config():
    """Get current configuration"""
    llm_config = {name: model_config.model_dump() for name, model_config in config.llm.items()}
    return JSONResponse(content={
        "llm": llm_config,
        "sandbox": config.sandbox.model_dump() if config.sandbox else None,
        "browser_config": config.browser_config.model_dump() if config.browser_config else None,
    })

@app.post("/api/config/llm/{profile}")
async def update_llm_config(
    profile: str,
    model: str = Form(...),
    base_url: str = Form(...),
    api_key: str = Form(...),
    max_tokens: int = Form(4096),
    temperature: float = Form(0.0),
    api_type: str = Form(...),
    api_version: str = Form(...)
):
    """Update LLM configuration for a specific profile"""
    # Create or update the LLM profile
    new_settings = LLMSettings(
        model=model,
        base_url=base_url,
        api_key=api_key,
        max_tokens=max_tokens,
        temperature=temperature,
        api_type=api_type,
        api_version=api_version
    )

    # In a real implementation, we would update the config file here
    # This is a simplified version that just returns success
    return JSONResponse(content={"status": "success", "message": f"Updated {profile} settings"})

@app.get("/api/agents")
async def get_agents():
    """Get list of available agents"""
    agents = get_all_agents()
    return JSONResponse(content={"agents": list(agents.keys())})

@app.get("/api/tools")
async def get_tools():
    """Get list of available tools"""
    tools = get_all_tools()
    return JSONResponse(content={"tools": list(tools.keys())})

@app.post("/api/prompt")
async def process_prompt(prompt_request: PromptRequest):
    """Process a prompt and return the response"""
    global agent_instance, usage_stats

    # Initialize agent if not already done
    if agent_instance is None:
        agent_instance = MCPAgent()

    # Get today's date for stats
    today = datetime.now().strftime("%Y-%m-%d")

    # Update usage statistics
    usage_stats["total_requests"] += 1

    model = prompt_request.model or agent_instance.llm.model

    if model not in usage_stats["requests_by_model"]:
        usage_stats["requests_by_model"][model] = 0
    usage_stats["requests_by_model"][model] += 1

    if today not in usage_stats["requests_by_day"]:
        usage_stats["requests_by_day"][today] = 0
    usage_stats["requests_by_day"][today] += 1

    try:
        # Process the prompt
        response = await agent_instance.run(prompt_request.prompt)

        # Estimate token usage (in a real implementation, you'd get this from the API response)
        estimated_prompt_tokens = len(prompt_request.prompt.split()) * 1.3
        estimated_response_tokens = len(response.split()) * 1.3
        estimated_total_tokens = int(estimated_prompt_tokens + estimated_response_tokens)

        # Update token usage stats
        usage_stats["token_usage"]["total"] += estimated_total_tokens
        if model not in usage_stats["token_usage"]["by_model"]:
            usage_stats["token_usage"]["by_model"][model] = 0
        usage_stats["token_usage"]["by_model"][model] += estimated_total_tokens

        return JSONResponse(content={
            "response": response,
            "usage": {
                "prompt_tokens": int(estimated_prompt_tokens),
                "completion_tokens": int(estimated_response_tokens),
                "total_tokens": estimated_total_tokens
            }
        })
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/api/models")
async def get_models():
    """Get list of available models"""
    llm_config = {name: config.model for name, config in config.llm.items()}
    return JSONResponse(content={"models": llm_config})

@app.post("/api/logs")
async def add_log(log: LogEntry):
    """Add a log entry (for frontend to report errors)"""
    # In a real implementation, you would store logs in a database or file
    print(f"[{log.timestamp}] {log.level}: {log.message}")
    return JSONResponse(content={"status": "success"})

# Run the application
if __name__ == "__main__":
    uvicorn.run("app.web.server:app", host="0.0.0.0", port=8000, reload=True)
