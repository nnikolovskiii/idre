import re
import uuid
from langchain_core.messages import AIMessage, HumanMessage
from .config import settings
from .data_models import BrainstormGraphState
from .prompts import brainstorm_answer_instruction
from .utils import get_api_key, process_audio_input
from ...containers import container


def prepare_inputs_node(state: BrainstormGraphState):
    print("---NODE: Brainstorm Prepare Inputs---")
    files_contents = state.get("files_contents")
    text_input = state.get("text_input")
    audio_path = state.get("audio_path")
    light_model = state.get("light_model", settings.DEFAULT_LIGHT_MODEL)
    messages = state.get("messages", [])

    api_key = get_api_key(state.get("api_key"))

    if not text_input and not audio_path:
        raise ValueError("Either text_input or audio_path must be provided.")

    processed_parts = []
    enhanced_transcript = None

    if text_input:
        processed_parts.append(f"{text_input}")

    if audio_path:
        enhanced_transcript = process_audio_input(audio_path, light_model, api_key)
        processed_parts.append(f"{enhanced_transcript}")

    if files_contents:
        processed_parts.append(f"# Project file contents:\n{files_contents}")

    final_input = "\n\n".join(processed_parts)

    human_message_kwargs = {}
    if audio_path:
        human_message_kwargs["file_url"] = audio_path

    human_msg = HumanMessage(
        content=final_input,
        id=str(uuid.uuid4()),
        additional_kwargs=human_message_kwargs,
    )

    return {
        "messages": [human_msg],
        "processed_input": final_input,
        "enhanced_transcript": enhanced_transcript,
    }


def generate_answer_node(state: BrainstormGraphState):
    print("---NODE: Brainstorm Generate Answer---")
    user_task = state["processed_input"]
    web_search = state.get("web_search", False)
    messages = state["messages"]
    heavy_model = state.get("heavy_model", settings.DEFAULT_HEAVY_MODEL)

    api_key = get_api_key(state.get("api_key"))

    context_parts = []
    for m in messages[:-1]:
        role = "Human" if isinstance(m, HumanMessage) else "AI"
        if m.content.strip():
            context_parts.append(f"{role}: {m.content}")
    context = "\n".join(context_parts)

    instruction = brainstorm_answer_instruction.format(
        user_task=user_task,
        context=context,
    )

    if web_search and state.get("api_key"):
        heavy_model += settings.ONLINE_MODEL_SUFFIX

    open_router_model = container.openrouter_model(api_key=api_key, model=heavy_model)

    try:
        result: AIMessage = open_router_model.invoke(instruction)
        result.content = result.content.split("</think>")[-1]
        result.content = re.sub(r"\n{2,}", "\n", result.content).strip()
        result.id = str(uuid.uuid4())
        return {
            "messages": [result],
            "processed_input": None,
            "enhanced_transcript": None,
            "text_input": None,
            "audio_path": None,
        }
    except Exception as e:
        error_msg = AIMessage(content=f"Error: {e}", id=str(uuid.uuid4()))
        return {"messages": [error_msg]}