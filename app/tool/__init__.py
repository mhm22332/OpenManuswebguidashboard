from app.tool.base import BaseTool
from app.tool.bash import Bash
from app.tool.browser_use_tool import BrowserUseTool
from app.tool.create_chat_completion import CreateChatCompletion
from app.tool.planning import PlanningTool
from app.tool.str_replace_editor import StrReplaceEditor
from app.tool.terminate import Terminate
from app.tool.tool_collection import ToolCollection


__all__ = [
    "BaseTool",
    "Bash",
    "BrowserUseTool",
    "Terminate",
    "StrReplaceEditor",
    "ToolCollection",
    "CreateChatCompletion",
    "PlanningTool",
]

def get_all_tools():
    """
    Return a dictionary of all available tools.

    Returns:
        dict: A dictionary mapping tool names to tool classes
    """
    return {
        "BaseTool": BaseTool,
        "Bash": Bash,
        "BrowserUseTool": BrowserUseTool,
        "CreateChatCompletion": CreateChatCompletion,
        "PlanningTool": PlanningTool,
        "StrReplaceEditor": StrReplaceEditor,
        "Terminate": Terminate,
        "ToolCollection": ToolCollection,
    }
