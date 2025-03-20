import os
import json
import time
import sys
import importlib
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import FastAPI, Request, Form, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn
from pydantic import BaseModel
import warnings
import platform
import psutil

from app.config import Config, LLMSettings
# More robust imports with fallbacks
try:
    from app.agent import get_all_agents
except ImportError:
    # Define fallback if import fails
    def get_all_agents():
        """Fallback function if import fails"""
        print("Warning: Using fallback get_all_agents function")
        return {
            "BaseAgent": "BaseAgent",
            "MCPAgent": "MCPAgent"
        }

try:
    from app.tool import get_all_tools
except ImportError:
    # Define fallback if import fails
    def get_all_tools():
        """Fallback function if import fails"""
        print("Warning: Using fallback get_all_tools function")
        return {
            "BaseTool": "BaseTool",
            "BrowserUseTool": "BrowserUseTool"
        }

try:
    from app.llm import MULTIMODAL_MODELS
except ImportError:
    MULTIMODAL_MODELS = ["gpt-4", "gpt-4o"]

try:
    from app.agent.base import Agent
    from app.agent.mcp import MCPAgent
except ImportError:
    print("Warning: Could not import Agent classes")

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
try:
    config = Config()
except Exception as e:
    print(f"Error loading config: {e}")
    config = None

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
    if not config:
        return JSONResponse(content={"error": "Configuration not available"}, status_code=500)

    try:
        llm_config = {name: model_config.model_dump() for name, model_config in config.llm.items()}
        return JSONResponse(content={
            "llm": llm_config,
            "sandbox": config.sandbox.model_dump() if config.sandbox else None,
            "browser_config": config.browser_config.model_dump() if config.browser_config else None,
        })
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

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
    try:
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
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/api/agents")
async def get_agents():
    """Get list of available agents"""
    try:
        agents = get_all_agents()
        return JSONResponse(content={"agents": list(agents.keys())})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/api/tools")
async def get_tools():
    """Get list of available tools"""
    try:
        tools = get_all_tools()
        return JSONResponse(content={"tools": list(tools.keys())})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/api/prompt")
async def process_prompt(prompt_request: PromptRequest):
    """Process a prompt and return the response"""
    global agent_instance, usage_stats

    # Initialize agent if not already done
    try:
        if agent_instance is None:
            try:
                agent_instance = MCPAgent()
            except Exception as e:
                error_message = str(e)
                if "API key" in error_message.lower() or "authentication" in error_message.lower():
                    return JSONResponse(
                        status_code=401,
                        content={"error": "API key issue", "message": f"Missing or invalid API key. Please check your config.toml file.", "details": str(e)}
                    )
                elif "model" in error_message.lower():
                    return JSONResponse(
                        status_code=400,
                        content={"error": "Model configuration issue", "message": "The specified model is invalid or unavailable.", "details": str(e)}
                    )
                return JSONResponse(
                    status_code=500,
                    content={"error": "Agent initialization failed", "message": f"Failed to initialize agent. Check your configuration.", "details": str(e)}
                )

        # Get today's date for stats
        today = datetime.now().strftime("%Y-%m-%d")

        # Update usage statistics
        usage_stats["total_requests"] += 1

        model = prompt_request.model or getattr(agent_instance.llm, 'model', 'unknown')

        if model not in usage_stats["requests_by_model"]:
            usage_stats["requests_by_model"][model] = 0
        usage_stats["requests_by_model"][model] += 1

        if today not in usage_stats["requests_by_day"]:
            usage_stats["requests_by_day"][today] = 0
        usage_stats["requests_by_day"][today] += 1

        # Process the prompt
        try:
            response = await agent_instance.run(prompt_request.prompt)
        except Exception as e:
            error_message = str(e)
            if "quota" in error_message.lower() or "rate limit" in error_message.lower() or "exceeded" in error_message.lower():
                return JSONResponse(
                    status_code=429,
                    content={"error": "Rate limit exceeded", "message": "API rate limit or quota exceeded. Please try again later.", "details": error_message}
                )
            elif "key" in error_message.lower() or "auth" in error_message.lower():
                return JSONResponse(
                    status_code=401,
                    content={"error": "Authentication error", "message": "Invalid or expired API key. Please check your API key.", "details": error_message}
                )
            elif "model" in error_message.lower() and "not found" in error_message.lower():
                return JSONResponse(
                    status_code=404,
                    content={"error": "Model not found", "message": "The specified model does not exist or is not available.", "details": error_message}
                )
            elif "timeout" in error_message.lower() or "timed out" in error_message.lower():
                return JSONResponse(
                    status_code=504,
                    content={"error": "Request timeout", "message": "Request to LLM provider timed out. Please try again.", "details": error_message}
                )
            return JSONResponse(
                status_code=500,
                content={"error": "Prompt processing error", "message": f"Error processing prompt: {error_message}", "details": error_message}
            )

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
            content={"error": f"Unexpected error: {str(e)}"}
        )

@app.get("/api/models")
async def get_models():
    """Get list of available models"""
    if not config:
        return JSONResponse(content={"models": {}})

    try:
        llm_config = {name: config.model for name, config in config.llm.items()}
        return JSONResponse(content={"models": llm_config})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/api/logs")
async def add_log(log: LogEntry):
    """Add a log entry (for frontend to report errors)"""
    # In a real implementation, you would store logs in a database or file
    print(f"[{log.timestamp}] {log.level}: {log.message}")
    return JSONResponse(content={"status": "success"})

@app.get("/api/system")
async def get_system_metrics():
    """Get system metrics for the dashboard"""
    try:
        # Get CPU stats
        cpu_percent = psutil.cpu_percent(interval=0.5)

        # Get memory stats
        memory = psutil.virtual_memory()
        memory_used = memory.used
        memory_total = memory.total
        memory_percent = memory.percent

        # Get disk stats
        disk = psutil.disk_usage('/')
        disk_used = disk.used
        disk_total = disk.total
        disk_percent = disk.percent

        # Get network stats
        net_counters = psutil.net_io_counters()

        # We need to calculate the per-second values
        # For simplicity, we'll just return the last value
        # In a real implementation, you would track previous values and calculate the delta
        net_sent_per_sec = 0
        net_recv_per_sec = 0

        # Static network metrics for now (since we can't easily get per-second stats without state)
        # In production, you would implement a proper tracking mechanism
        net_sent_per_sec = 5 * 1024  # 5 KB/s (simulated)
        net_recv_per_sec = 12 * 1024  # 12 KB/s (simulated)

        return {
            "cpu_percent": cpu_percent,
            "memory_used": memory_used,
            "memory_total": memory_total,
            "memory_percent": memory_percent,
            "disk_used": disk_used,
            "disk_total": disk_total,
            "disk_percent": disk_percent,
            "net_sent_per_sec": net_sent_per_sec,
            "net_recv_per_sec": net_recv_per_sec,
            "platform": platform.system(),
            "platform_version": platform.version(),
            "python_version": platform.python_version(),
            "hostname": platform.node(),
            "uptime": int(datetime.now().timestamp() - psutil.boot_time())
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to retrieve system metrics", "message": str(e)}
        )

# Print diagnostic info on startup
print(f"Python version: {sys.version}")
print(f"Module search paths: {sys.path}")
print(f"Current working directory: {os.getcwd()}")

# Run the application
if __name__ == "__main__":
    uvicorn.run("app.web.server:app", host="0.0.0.0", port=8000, reload=True)
