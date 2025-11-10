from __future__ import annotations

import asyncio
import os
import re
import tempfile
import uuid

import requests
from dotenv import load_dotenv
from langchain_core.messages import AIMessage, HumanMessage
from pydantic import BaseModel, Field

from .brainstorm_prompt import brainstorm_answer_instruction
from .chat_graph.data_models import ChatGraphState
from ..containers import container

from ..tools.audio_utils import transcribe_audio

load_dotenv()
file_service_url = os.getenv("FILE_SERVICE_URL")
file_service_docker_url = os.getenv("FILE_SERVICE_URL_DOCKER")
upload_password = os.getenv("UPLOAD_PASSWORD")


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
            headers = {"password": upload_password}
            response = requests.get(audio_path, stream=True, headers=headers)
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
        try:
            response: RestructuredText = structured_llm.invoke(prompt)
            enhanced_text = response.text
            print(f"   > Enhanced Transcript: '{enhanced_text[:100]}...'")
            return enhanced_text
        except Exception as e:
            print(f"   > ERROR during transcript enhancement: {e}")
            print("   > Falling back to raw transcript due to enhancement failure.")
            return transcript
    finally:
        if temp_file_handle:
            os.unlink(local_audio_path)
            print(f"   > Cleaned up temporary file: {local_audio_path}")


def brainstorm_prepare_inputs(state: ChatGraphState):
    """
    Prepares the final input string, creates the HumanMessage, and adds it to the state.
    """
    print("---NODE: Preparing Inputs & Saving Human Message---")
    files_contents = state.get("files_contents", None)
    text_input = state.get("text_input")
    audio_path = state.get("audio_path")
    light_model = state.get("light_model", "google/gemini-flash-1.5")
    messages = state.get("messages", [])

    encrypt_api_key = state.get("api_key", None)
    fernet_service = container.fernet_service()
    if encrypt_api_key:
        api_key = fernet_service.decrypt_data(encrypt_api_key)
    else:
        api_key = os.getenv("OPENROUTER_API_KEY")
        if "free" not in light_model:
            raise ValueError(
                "API key is required for non-free models. Please provide a valid API key."
            )

    if light_model is None:
        light_model = "google/gemini-flash-1.5"
    if not text_input and not audio_path:
        raise ValueError("Either text_input or audio_path must be provided.")

    if audio_path:
        audio_path = audio_path.replace(
            file_service_url, file_service_docker_url
        )

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
    if files_contents:
        print("   > Files contents detected.")
        processed_parts.append(f"# Project file contents:\n{files_contents}")

    final_input = "\n\n".join(processed_parts)
    print(f"   > Final Processed Input: '{final_input[:150]}...'")

    # Create and save the HumanMessage immediately
    human_message_kwargs = {}
    if audio_path:
        external_audio_path = audio_path.replace(
            file_service_docker_url, file_service_url
        )
        human_message_kwargs["file_url"] = external_audio_path

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


def brainstorm_generate_answer(state: ChatGraphState):
    """
    Generates the AI answer and appends it to the messages list.
    The HumanMessage is already in the state.
    """
    print("---NODE: Generating Answer---")
    user_task = state["processed_input"]
    web_search = state["web_search"]
    print(f"   > Web search: '{web_search}'")
    messages = state["messages"]  # This now includes the new HumanMessage
    heavy_model = state.get("heavy_model", "google/gemini-pro-1.5")
    light_model = state.get("light_model", "google/gemini-flash-1.5")
    print(f"   > Using heavy model: {heavy_model}" f" and light model: {light_model}")

    encrypt_api_key = state.get("api_key")
    fernet_service = container.fernet_service()
    if encrypt_api_key:
        api_key = fernet_service.decrypt_data(encrypt_api_key)
    else:
        api_key = os.getenv("OPENROUTER_API_KEY")
        if "free" not in light_model or "free" not in heavy_model:
            raise ValueError(
                "API key is required for non-free models. Please provide a valid API key."
            )
    if heavy_model is None:
        heavy_model = "google/gemini-pro-1.5"

    context_parts = []
    # Build context from all messages *except* the last one (which is the current user task)
    for m in messages[:-1]:
        if hasattr(m, "content"):
            content = m.content
            role = "Human" if isinstance(m, HumanMessage) else "AI"
        elif isinstance(m, dict):
            content = m.get("content", "")
            msg_type = m.get("type", "ai").lower()
            role = "Human" if msg_type == "human" else "AI"
        else:
            content = str(m)
            role = "AI"
        if content.strip():
            context_parts.append(f"{role}: {content}")
    context = "\n".join(context_parts)

    instruction = brainstorm_answer_instruction.format(
        user_task=user_task,
        context=context,
    )

    if web_search and encrypt_api_key:
        print("Online....")
        heavy_model = heavy_model + ":online"

    open_router_model = container.openrouter_model(api_key=api_key, model=heavy_model)

    try:
        print("   > Invoking LLM for the final answer...")
        result: AIMessage = open_router_model.invoke(instruction)
        print("   > LLM response received.")
        result.content = result.content.split("</think>")[-1]
        result.content = re.sub(r"\n{2,}", "\n", result.content).strip()
        print(f"   > Cleaned Answer Content: '{result.content[:150]}...'")
    except Exception as e:
        print(f"   > ERROR generating main answer: {e}")
        error_content = f"Sorry, an error occurred while generating the answer: {e}"
        error_message = AIMessage(content=error_content, id=str(uuid.uuid4()))
        return {
            "messages": [error_message],  # Append error to existing messages
            # Clear out temporary state values
            "processed_input": None,
            "enhanced_transcript": None,
            "audio_path": None,
            "light_model": None,
            "heavy_model": None,
            "text_input": None,
            "api_key": None,
            "files_contents": None,
            "web_search": None,
        }

    # try:
    #     print("   > Generating text-to-speech audio for the answer...")
    #     light_open_router = container.openrouter_model(api_key=api_key, model=light_model)
    #     conclusion_instruction = get_conclusion_instruction.format(
    #         user_task=user_task, ai_message=result.content
    #     )
    #     structured_model = light_open_router.with_structured_output(Conclusion)
    #     conclusion = structured_model.invoke(conclusion_instruction)
    #     no_markdown_text = remove_markdown(conclusion.text)
    #     output_audio_file = asyncio.run(text_to_speech_upload_file(no_markdown_text))
    #     print(f"   > Text-to-speech audio file created: {output_audio_file}")
    #     output_audio_url = f"{file_service_url}/test/download/{output_audio_file}"
    #     result.additional_kwargs["file_url"] = output_audio_url
    # except Exception as e:
    #     print(
    #         f"   > WARNING: Could not generate TTS audio. Returning text only. Error: {e}"
    #     )

    result.id = str(uuid.uuid4())

    return {
        "messages": [result],  # Append success result to existing messages
        # Clear out temporary state values
        "processed_input": None,
        "enhanced_transcript": None,
        "audio_path": None,
        "light_model": None,
        "heavy_model": None,
        "text_input": None,
        "api_key": None,
        "files_contents": None,
        "web_search": None,
    }
