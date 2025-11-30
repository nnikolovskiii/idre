import uuid
import re
from langchain_core.messages import AIMessage, HumanMessage
from .config import settings
from .data_models import ProsConsGraphState
from .prompts import (
    positive_analysis_instruction,
    negative_analysis_instruction,
    combine_responses_instruction
)
from .utils import get_api_key, process_audio_input_pros_cons
from ...containers import container


def pros_cons_prepare_inputs(state: ProsConsGraphState):
    print("---NODE: Pros/Cons Prepare Inputs---")
    files_contents = state.get("files_contents")
    text_input = state.get("text_input")
    audio_path = state.get("audio_path")
    light_model = state.get("light_model", settings.DEFAULT_LIGHT_MODEL)
    messages = state.get("messages", [])
    api_key = get_api_key(state.get("api_key"))

    if not text_input and not audio_path:
        raise ValueError("Input required")

    processed_parts = []
    enhanced_transcript = None
    if text_input: processed_parts.append(text_input)
    if audio_path:
        enhanced_transcript = process_audio_input_pros_cons(audio_path, light_model, api_key)
        processed_parts.append(enhanced_transcript)
    if files_contents: processed_parts.append(files_contents)

    final_input = "\n\n".join(processed_parts)

    # Build context string
    context_parts = [f"{'Human' if isinstance(m, HumanMessage) else 'AI'}: {m.content}" for m in messages]
    context = "\n".join(context_parts)

    human_msg = HumanMessage(content=final_input, id=str(uuid.uuid4()))

    return {
        "messages": [human_msg],
        "processed_input": final_input,
        "enhanced_transcript": enhanced_transcript,
        "context": context
    }


def pros_cons_generate_positive(state: ProsConsGraphState):
    print("---NODE: Pros/Cons Positive---")
    api_key = get_api_key(state.get("api_key"))
    heavy = state.get("heavy_model", settings.DEFAULT_HEAVY_MODEL)
    if state.get("web_search") and state.get("api_key"): heavy += settings.ONLINE_MODEL_SUFFIX

    open_router = container.openrouter_model(api_key=api_key, model=heavy)
    instr = positive_analysis_instruction.format(user_task=state["processed_input"], context=state["context"])

    res = open_router.invoke(instr)
    clean = res.content.split("````")[-1].strip()
    return {"positive_response": clean}


def pros_cons_generate_negative(state: ProsConsGraphState):
    print("---NODE: Pros/Cons Negative---")
    api_key = get_api_key(state.get("api_key"))
    heavy = state.get("heavy_model", settings.DEFAULT_HEAVY_MODEL)
    if state.get("web_search") and state.get("api_key"): heavy += settings.ONLINE_MODEL_SUFFIX

    open_router = container.openrouter_model(api_key=api_key, model=heavy)
    instr = negative_analysis_instruction.format(user_task=state["processed_input"], context=state["context"])

    res = open_router.invoke(instr)
    clean = res.content.split("````")[-1].strip()
    return {"negative_response": clean}


def pros_cons_combine_responses(state: ProsConsGraphState):
    print("---NODE: Pros/Cons Combine---")
    api_key = get_api_key(state.get("api_key"))

    # Use light model for the combination step
    light = state.get("light_model", settings.DEFAULT_LIGHT_MODEL)

    open_router = container.openrouter_model(api_key=api_key, model=light)
    instr = combine_responses_instruction.format(
        positive_response=state["positive_response"],
        negative_response=state["negative_response"]
    )

    res = open_router.invoke(instr)
    final_text = res.content.split("````")[-1].strip()

    formatted = f"# Analysis\n\n## Pros\n{state['positive_response']}\n\n## Cons\n{state['negative_response']}\n\n## Conclusion\n{final_text}"

    ai_msg = AIMessage(content=formatted, id=str(uuid.uuid4()))

    return {
        "messages": [ai_msg],
        "processed_input": None,
        "context": None,
        "text_input": None,
        "audio_path": None,
    }