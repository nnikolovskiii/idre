from __future__ import annotations

import os
from typing import Literal

from langchain_core.messages import SystemMessage, ToolMessage, HumanMessage
from langgraph.constants import END

from .state import State
from ..tools.llm_tools import llm_with_tools, tools_by_name
from ..prompts.prompts import agent_instruction
from .ai_models import kimi_llm, gpt5
from ..models.step_models import Step, StepList


def segment_into_steps(state: State):
    """
    Segment the plan into steps.
    """
    plan = state["plan"]
    agent_metadata = state.get("agent_metadata", "")

    from ..prompts.prompts import segment_plan_into_steps
    formatted_prompt = segment_plan_into_steps.format(
        plan=plan,
        agent_metadata=agent_metadata,
    )

    structured_llm = gpt5.with_structured_output(StepList)

    print("Invoking LLM to segment plan into steps...")
    result = structured_llm.invoke(formatted_prompt)

    # Initialize step_message_indices with the first step starting at index 0
    step_message_indices = {0: len(state.get("messages", []))}

    return {"steps": result.steps, "current_step_index": 0, "step_message_indices": step_message_indices}


def llm_call(state: State):
    """LLM decides whether to call a tool or not using agent_instruction"""

    # Get the current step and previous steps
    steps = state.get("steps", [])
    current_step_index = state.get("current_step_index", 0)

    current_step = ""
    previous_steps = ""

    if steps and current_step_index < len(steps):
        current_step = steps[current_step_index].description

    if steps and current_step_index > 0:
        previous_steps = "\n".join([f"- {step.description}" for step in steps[:current_step_index]])

    # Get only the messages for the current step
    all_messages = state.get("messages", [])
    step_message_indices = state.get("step_message_indices", {})
    start_index = step_message_indices.get(current_step_index, 0)
    current_step_messages = all_messages[start_index:]

    formatted_instruction = agent_instruction.format(
        current_step=current_step,
        previous_steps=previous_steps,
        plan=state.get("plan", ""),
        action_history="\n".join([str(msg) for msg in current_step_messages]),
        project_structure=state.get("project_structure", ""),
    )

    messages = llm_with_tools.invoke(formatted_instruction)

    return {
        "messages": [messages]
    }


def should_continue(state: State) -> Literal["environment", "next_step", "push_to_git"]:
    """Decide if we should continue the loop or stop based upon whether the LLM made a tool call"""

    messages = state["messages"]
    last_message = messages[-1]
    if last_message.tool_calls:
        return "Action"

    # If the LLM didn't make a tool call, it means the current step is finished
    # Check if there are more steps to do
    steps = state.get("steps", [])
    current_step_index = state.get("current_step_index", 0)

    if current_step_index < len(steps) - 1:
        # There are more steps, move to the next one
        return "next_step"

    # No more steps, end the workflow
    return "push_to_git"


def tool_node(state: dict):
    """Performs the tool call"""

    result = []
    for tool_call in state["messages"][-1].tool_calls:
        tool = tools_by_name[tool_call["name"]]
        observation = tool.invoke(tool_call["args"])
        result.append(ToolMessage(content=observation, tool_call_id=tool_call["id"]))
    return {"messages": result}


def next_step(state: State):
    """Move to the next step"""

    current_step_index = state.get("current_step_index", 0)
    next_step_index = current_step_index + 1

    # Record the current length of the messages array as the starting index for the next step
    step_message_indices = state.get("step_message_indices", {})
    step_message_indices[next_step_index] = len(state.get("messages", []))

    # Increment the current step index
    return {"current_step_index": next_step_index, "step_message_indices": step_message_indices}
