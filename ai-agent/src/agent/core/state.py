from __future__ import annotations

from typing import Annotated, TypedDict, List, Dict, Union, Any
from langchain_core.messages import BaseMessage

from ..models.task_models import Task


def manage_messages(
        left: List[BaseMessage], right: Union[List[BaseMessage], Dict[str, Any]]
) -> List[BaseMessage]:
    """
    A custom reducer for the `messages` state.
    - If `right` is a list, it appends messages (like `add_messages`).
    - If `right` is a dict with a key `"$replace"`, it replaces the entire list.
    """
    if isinstance(right, dict) and "$replace" in right:
        # Replace the entire state with the provided list
        return right["$replace"]

    # Default behavior: append messages
    if isinstance(left, list) and isinstance(right, list):
        return left + right

    return right


# Graph state
class State(TypedDict):
    messages: Annotated[list[BaseMessage], manage_messages]
    project_path: str
    context: str
    user_task: str
    all_file_paths: Annotated[set, lambda x, y: x.union(y)]
    project_structure: str
    plan: str
    tasks: List[Task]
    current_task_index: int
    task_message_indices: Dict[int, int]
    input_type: str
    answer: str
    agent_metadata: str
    ai_model: str
    audio_path: str  # Path to the audio file
    transcript: str  # Extracted text from the audio
    enhanced_text: str  # Text after enhancement by LLM

