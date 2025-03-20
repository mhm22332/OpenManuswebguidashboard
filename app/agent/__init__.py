from app.agent.base import BaseAgent
from app.agent.browser import BrowserAgent
from app.agent.mcp import MCPAgent
from app.agent.planning import PlanningAgent
from app.agent.react import ReActAgent
from app.agent.swe import SWEAgent
from app.agent.toolcall import ToolCallAgent


__all__ = [
    "BaseAgent",
    "BrowserAgent",
    "PlanningAgent",
    "ReActAgent",
    "SWEAgent",
    "ToolCallAgent",
    "MCPAgent",
]

def get_all_agents():
    """
    Return a dictionary of all available agents.

    Returns:
        dict: A dictionary mapping agent names to agent classes
    """
    return {
        "BaseAgent": BaseAgent,
        "BrowserAgent": BrowserAgent,
        "MCPAgent": MCPAgent,
        "PlanningAgent": PlanningAgent,
        "ReActAgent": ReActAgent,
        "SWEAgent": SWEAgent,
        "ToolCallAgent": ToolCallAgent,
    }
