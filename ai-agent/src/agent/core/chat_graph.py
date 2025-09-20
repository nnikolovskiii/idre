from __future__ import annotations

import asyncio
import os
import re
import tempfile
import uuid

import requests
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from pydantic import BaseModel, Field

from ..containers import container
from ..prompts.chat_grap_prompts import (
    generate_answer_instruction,
    get_conclusion_instruction,
)
from ..tools.audio_utils import transcribe_audio
from ..tools.kokoroko_utils import text_to_speech_upload_file
from ..tools.utils import remove_markdown
from .chat_graph_state import ChatGraphState

load_dotenv()
file_service_url = os.getenv("FILE_SERVICE_URL")
file_service_docker_url = os.getenv("FILE_SERVICE_URL_DOCKER")


class RestructuredText(BaseModel):
    text: str = Field(..., description="Restructured text")


class Conclusion(BaseModel):
    text: str = Field(description="Conclusion text")


def _transcribe_and_enhance_audio(audio_path: str, model: str, api_key: str) -> str:
    """Helper to chain transcription and enhancement.
    Handles both local file paths and remote URLs.
    """
    local_audio_path = audio_path
    temp_file_handle = None

    if audio_path.startswith(("http://", "https://")):
        print(f"   > URL detected. Downloading audio from {audio_path}...")
        try:
            response = requests.get(audio_path, stream=True)
            response.raise_for_status()

            temp_file_handle = tempfile.NamedTemporaryFile(delete=False, suffix=".ogg")

            with temp_file_handle as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            local_audio_path = temp_file_handle.name
            print(f"   > Audio downloaded to temporary file: {local_audio_path}")

        except requests.exceptions.RequestException as e:
            raise ConnectionError(
                f"Failed to download audio from {audio_path}. Error: {e}"
            )

    try:
        if not os.path.exists(local_audio_path):
            raise FileNotFoundError(f"Audio file not found: {local_audio_path}")

        transcript = transcribe_audio(local_audio_path)
        print(f"   > Raw Transcript: '{transcript[:100]}...'")

        prompt = f"""Below there is an audio transcript. Rewrite it in a way there is complete sentences and no pauses.
    Regardless of the input write it in English.
    
    Important:
    Do not try to answer if there is a question

    Text:
    "{transcript}"
    """
        open_router_model = container.openrouter_model(api_key=api_key, model=model)
        structured_llm = open_router_model.with_structured_output(RestructuredText)

        response: RestructuredText = structured_llm.invoke(prompt)
        enhanced_text = response.text
        print(f"   > Enhanced Transcript: '{enhanced_text[:100]}...'")
        return enhanced_text

    finally:
        if temp_file_handle:
            os.unlink(local_audio_path)
            print(f"   > Cleaned up temporary file: {local_audio_path}")


def prepare_inputs_node(state: ChatGraphState):
    """Prepares the final input string by processing audio and/or text.
    This node handles all three cases: audio-only, text-only, and both.
    """
    print("---NODE: Preparing Inputs---")
    text_input = state.get("text_input")
    audio_path = state.get("audio_path")
    light_model = state.get("light_model", "google/gemini-flash-1.5")

    encrypt_api_key = state.get("api_key")
    fernet_service = container.fernet_service()
    api_key = fernet_service.decrypt_data(encrypt_api_key)

    if light_model is None:
        light_model = "google/gemini-flash-1.5"

    if not text_input and not audio_path:
        raise ValueError("Either text_input or audio_path must be provided.")

    processed_parts = []
    enhanced_transcript = None

    if text_input:
        print("   > Text input detected.")
        processed_parts.append(f"{text_input}")

    if audio_path:
        print("   > Audio path detected. Processing audio...")
        enhanced_transcript = _transcribe_and_enhance_audio(
            audio_path, light_model, api_key
        )
        processed_parts.append(f"{enhanced_transcript}")

    final_input = "\n\n".join(processed_parts)
    print(f"   > Final Processed Input: '{final_input[:150]}...'")

    return {"processed_input": final_input, "enhanced_transcript": enhanced_transcript}


def generate_answer_node(state: ChatGraphState):
    """Generates the final answer and attaches the audio_path as metadata."""
    print("---NODE: Generating Answer---")
    user_task = state["processed_input"]
    messages = state["messages"]
    heavy_model = state.get("heavy_model", "google/gemini-2.5-pro")
    light_model = state.get("light_model", "google/gemini-2.5-flash")

    encrypt_api_key = state.get("api_key")
    fernet_service = container.fernet_service()
    api_key = fernet_service.decrypt_data(encrypt_api_key)

    if heavy_model is None:
        heavy_model = "google/gemini-2.5-pro"

    audio_path = state.get("audio_path")

    context = "\n".join(
        f"Human: {m.content}" if isinstance(m, HumanMessage) else f"AI: {m.content}"
        for m in messages
    )

    instruction = generate_answer_instruction.format(
        user_task=user_task,
        context=context,
    )

    open_router_model = container.openrouter_model(api_key=api_key, model=heavy_model)
    print("   > Invoking LLM for the final answer...")
    result = open_router_model.invoke(instruction)
    print("   > LLM response received.")

    if audio_path:
        audio_path = audio_path.replace(file_service_docker_url, file_service_url)

    human_message_kwargs = {}
    if audio_path:
        human_message_kwargs["file_url"] = audio_path

    human_msg = HumanMessage(content=user_task, additional_kwargs=human_message_kwargs)

    result.content = result.content.split("</think>")[-1]
    result.content = re.sub(r"\n{2,}", "\n", result.content).strip()
    print(f"   > Cleaned Answer Content: '{result.content[:150]}...'")

    print("   > Generating text-to-speech audio for the answer...")

    light_open_router = container.openrouter_model(api_key=api_key, model=light_model)

    conclusion_instruction = get_conclusion_instruction.format(
        user_task=user_task, ai_message=result.content
    )

    structured_model = light_open_router.with_structured_output(Conclusion)

    conclusion = structured_model.invoke(conclusion_instruction)

    no_markdown_text = remove_markdown(conclusion.text)
    output_audio_file = asyncio.run(text_to_speech_upload_file(no_markdown_text))
    print(f"   > Text-to-speech audio file saved to: {output_audio_file}")

    output_audio_file = file_service_url + "/test/download/" + f"{output_audio_file}"
    result.additional_kwargs["file_url"] = output_audio_file
    human_msg.id = str(uuid.uuid4())
    result.id = str(uuid.uuid4())

    return {
        "messages": [human_msg, result],
        "processed_input": None,
        "enhanced_transcript": None,
        "audio_path": None,
        "light_model": None,
        "heavy_model": None,
        "text_input": None,
        "api_key": None,
    }
