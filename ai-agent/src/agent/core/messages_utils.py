from __future__ import annotations
from typing import Any, Dict, List, Union
from langchain_core.messages import BaseMessage


def manage_messages(
        left: List[BaseMessage], right: Union[List[BaseMessage], Dict[str, Any]]
) -> List[BaseMessage]:
    """A custom reducer for the `messages` state.
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
