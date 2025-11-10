from __future__ import annotations

import os
from typing import Optional, TypedDict
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from ..containers import container


load_dotenv()

class ChatTitleResponse(BaseModel):
    title: str = Field(..., description="The title of the chat")

class ChatNameGraphState(TypedDict):
    """Represents the state of the transcription graph.

    Attributes:
        audio_path: The path or URL to the user's audio file.
        enhanced_transcript: The processed text from the audio file.
        api_key: The API key for the model.
        light_model: The model to use for enhancing transcription.
    """
    first_message: Optional[str]
    api_key: Optional[str]
    light_model: Optional[str]
    title: Optional[str]


def generate_chat_name_node(state: ChatNameGraphState):
    print("---NODE: Generate name of the chat NODE---")
    fernet_service = container.fernet_service()
    first_message = state.get("first_message")
    light_model = state.get("light_model") or "google/gemini-2.5-flash"

    encrypt_api_key = state.get("api_key") or None

    if encrypt_api_key:
        api_key = fernet_service.decrypt_data(encrypt_api_key)
    else:
        api_key = os.getenv("OPENROUTER_API_KEY")

    if not api_key:
        raise ValueError("API key is required. Set OPENROUTER_API_KEY environment variable or pass api_key in state.")

    try:
        prompt = f"""Below is a first message of the chat. Generate a title/name for the chat. 
        If no first message is provided, generate a random name.
        
        Response output: 
        {{title: ""}}

        First message:
        "{first_message}"
        """
        open_router_model = container.openrouter_model(api_key=api_key, model=light_model)
        structured_llm = open_router_model.with_structured_output(ChatTitleResponse)

        response: ChatTitleResponse = structured_llm.invoke(prompt)
        title = response.title
        print(f"   > Chat title: '{title[:100]}...'")

        return {
            "title": title,
            "first_message": None,
            "api_key": None,
            "light_model": None,
        }

    except Exception as e:
        print(f"   > Error generating chat title: {e}")
        return {
            "title": "Chat",
        }