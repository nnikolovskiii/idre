from __future__ import annotations

import os
from typing import Optional, TypedDict
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from ..containers import container

load_dotenv()



class FileName(BaseModel):
    file_name: str = Field(..., description="File name suggestion")


class FileNameGraphState(TypedDict):
    """Represents the state of the transcription graph.

    Attributes:
        audio_path: The path or URL to the user's audio file.
        enhanced_transcript: The processed text from the audio file.
        api_key: The API key for the model.
        light_model: The model to use for enhancing transcription.
    """
    doc_content: Optional[str]
    api_key: Optional[str]
    light_model: Optional[str]
    file_name: Optional[FileName]


def generate_file_name(state: FileNameGraphState):
    print("---NODE: Generate file name NODE---")
    fernet_service = container.fernet_service()
    doc_content = state.get("doc_content")
    light_model = state.get("light_model") or "google/gemini-2.5-flash"

    encrypt_api_key = state.get("api_key") or None

    print(doc_content)

    if encrypt_api_key:
        api_key = fernet_service.decrypt_data(encrypt_api_key)
    else:
        api_key = os.getenv("OPENROUTER_API_KEY")

    if not api_key:
        raise ValueError("API key is required. Set OPENROUTER_API_KEY environment variable or pass api_key in state.")

    try:
        prompt = f"""Given the file content below, generate a title/name for the file. Don't add an extension.

        Make it with lower letters and for space use underscore.
        
        Context:
        "{doc_content}"
        """
        open_router_model = container.openrouter_model(api_key=api_key, model=light_model)
        structured_llm = open_router_model.with_structured_output(FileName)

        file_name_obj: FileName = structured_llm.invoke(prompt)
        print(f"   > File name suggestion: '{file_name_obj.file_name[:100]}...'")

        return {
            "file_name": file_name_obj.file_name,
            "messages": None,
            "api_key": None,
            "light_model": None,
        }

    except Exception as e:
        print(f"   > Error generating chat title: {e}")
        return {
            "file_name": None,
            "messages": None,
            "api_key": None,
            "light_model": None,
        }
