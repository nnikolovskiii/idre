import os
from .config import settings
from .data_models import TranscriptionGraphState, RestructuredText, GeneratedFileName
from .prompts import enhance_transcript_prompt, file_name_prompt
from .utils import get_api_key, decode_audio_to_temp, download_file_from_url
from ...containers import container
from ...tools.audio_utils import transcribe_audio


def transcribe_and_enhance_audio_node(state: TranscriptionGraphState):
    print("---NODE: Transcribing and Enhancing Audio---")

    file_url = state.get("file_url")
    audio_data_base64 = state.get("audio_data_base64")
    filename = state.get("filename")
    light_model = state.get("light_model") or settings.DEFAULT_LIGHT_MODEL
    api_key = get_api_key(state.get("api_key"))

    # Validation
    if not filename:
        raise ValueError("Filename must be provided.")
    if not file_url and not audio_data_base64:
        raise ValueError("Either file_url or audio_data_base64 must be provided.")
    if not api_key:
        raise ValueError("API key is required.")

    local_audio_path = None
    try:
        # 1. Get the local file path (either download or decode)
        if file_url:
            local_audio_path = download_file_from_url(file_url, filename)
            print(f"   > Audio downloaded to: {local_audio_path}")
        else:
            local_audio_path = decode_audio_to_temp(audio_data_base64, filename)
            print(f"   > Audio decoded to: {local_audio_path}")

        # 2. Transcribe
        transcript = transcribe_audio(local_audio_path)
        if not transcript:
            raise ValueError("Failed to transcribe audio.")
        print(f"   > Raw transcript: {transcript[:100]}...")

        open_router = container.openrouter_model(api_key=api_key, model=light_model)

        # 3. Enhance Transcript
        structured_enhance = open_router.with_structured_output(RestructuredText)
        enhance_instruction = enhance_transcript_prompt.format(transcript=transcript)
        enhanced_text = structured_enhance.invoke(enhance_instruction).text
        print(f"   > Enhanced transcript: {enhanced_text[:100]}...")

        # 4. Generate File Name
        structured_name = open_router.with_structured_output(GeneratedFileName)
        name_instruction = file_name_prompt.format(text=enhanced_text)
        file_name = structured_name.invoke(name_instruction).file_name

        return {
            "enhanced_transcript": enhanced_text,
            "file_name": file_name,
            "audio_data_base64": None, # Cleanup state
            "file_url": None,          # Cleanup state
            "filename": None
        }

    finally:
        # Cleanup temporary file
        if local_audio_path and os.path.exists(local_audio_path):
            os.unlink(local_audio_path)
            print("   > Temporary audio file deleted.")