from __future__ import annotations

import re
import uuid

from langchain_core.messages import AIMessage, HumanMessage

from .config import settings
from .data_models import ChatGraphState
from .prompts import generate_answer_instruction
from .utils import get_api_key, process_audio_input
from ...containers import container


def prepare_inputs_node(state: ChatGraphState) -> dict:
    """
    Processes raw inputs (text, audio, files) into a single HumanMessage for the graph.
    """
    print("---NODE: Preparing Inputs & Saving Human Message---")
    messages = state.get("messages", [])
    api_key_encrypted = state.get("api_key")
    light_model = state.get("light_model", settings.DEFAULT_LIGHT_MODEL)

    api_key = get_api_key(api_key_encrypted)
    if "free" not in light_model and not api_key_encrypted:
        raise ValueError("A user-provided API key is required for non-free models.")

    # Process inputs
    processed_parts = []
    if text_input := state.get("text_input"):
        print("   > Text input detected.")
        processed_parts.append(text_input)

    enhanced_transcript = None
    if audio_path := state.get("audio_path"):
        print("   > Audio path detected. Processing...")
        docker_audio_path = audio_path.replace(settings.FILE_SERVICE_URL, settings.FILE_SERVICE_URL_DOCKER)
        enhanced_transcript = process_audio_input(docker_audio_path, light_model, api_key)
        processed_parts.append(enhanced_transcript)

    if files_contents := state.get("files_contents"):
        print("   > Files contents detected.")
        processed_parts.append(f"# Project file contents:\n{files_contents}")

    if not processed_parts:
        raise ValueError("Either text_input, audio_path, or files_contents must be provided.")

    final_input = "\n\n".join(processed_parts)
    print(f"   > Final Processed Input: '{final_input[:150]}...'")

    # Create HumanMessage with optional file URL
    human_message_kwargs = {}
    if audio_path:
        human_message_kwargs["file_url"] = audio_path  # Use original external URL

    human_msg = HumanMessage(
        content=final_input,
        id=str(uuid.uuid4()),
        additional_kwargs=human_message_kwargs,
    )
    print("   > HumanMessage created and added to state.")

    return {
        "messages": [human_msg],
        "processed_input": final_input,
        "enhanced_transcript": enhanced_transcript,
    }


def generate_answer_node(state: ChatGraphState) -> dict:
    """
    Generates the AI's response based on the full conversation context and new input.
    """
    print("---NODE: Generating Answer---")
    messages = state["messages"]
    user_task = state["processed_input"]
    api_key_encrypted = state.get("api_key")
    heavy_model = state.get("heavy_model", settings.DEFAULT_HEAVY_MODEL)
    web_search = state.get("web_search", False)

    api_key = get_api_key(api_key_encrypted)
    if "free" not in heavy_model and not api_key_encrypted:
        raise ValueError("A user-provided API key is required for non-free models.")

    print(f"   > Using heavy model: {heavy_model}")

    # Build context from previous messages
    context_parts = [
        f"{'Human' if isinstance(m, HumanMessage) else 'AI'}: {m.content}"
        for m in messages[:-1]  # All messages except the last one (current user task)
        if m.content and m.content.strip()
    ]
    context = "\n".join(context_parts)

    instruction = generate_answer_instruction.format(user_task=user_task, context=context)

    if web_search and api_key_encrypted:  # Assuming online is a premium feature
        print("   > Web search enabled, using online model.")
        heavy_model += settings.ONLINE_MODEL_SUFFIX

    open_router_model = container.openrouter_model(api_key=api_key, model=heavy_model)

    try:
        print("   > Invoking LLM for the final answer...")
        result: AIMessage = open_router_model.invoke(instruction)
        print("   > LLM response received.")

        # Clean up common LLM artifacts
        result.content = result.content.split("</think>")[-1]
        result.content = re.sub(r"\n{2,}", "\n", result.content).strip()
        result.id = str(uuid.uuid4())
        print(f"   > Cleaned Answer Content: '{result.content[:150]}...'")

        final_messages = [result]

    except Exception as e:
        print(f"   > ERROR generating main answer: {e}")
        error_content = f"Sorry, an error occurred while generating the answer: {e}"
        error_message = AIMessage(content=error_content, id=str(uuid.uuid4()))
        final_messages = [error_message]

    # This node is terminal, so we clear the single-use state variables.
    return {
        "messages": final_messages,
        "processed_input": None,
        "enhanced_transcript": None,
    }