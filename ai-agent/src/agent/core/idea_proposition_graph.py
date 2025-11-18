from __future__ import annotations

import os
from typing import Optional, TypedDict, List, Dict, Any
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from ..containers import container

load_dotenv()


class MessageResponse(BaseModel):
    id: str
    content: str
    type: str
    additional_kwargs: Optional[Dict[str, Any]] = None


class IdeaProposition(BaseModel):
    what: str = Field(
        ...,
        description="A comprehensive description of the idea and what problem it solves. This should include the core concept, the main features, the specific problem it addresses, and how it fundamentally works. It combines the essence of the service/product and the problem it solves."
    )
    why: str = Field(
        ...,
        description="An explanation of why this idea matters and who it helps. This should cover the target audience, the importance of solving this problem, the impact on users' lives, and why this approach is valuable. It combines the audience context and the significance of the solution."
    )


class IdeaPropositionGraphState(TypedDict):
    """Represents the state of the transcription graph.

    Attributes:
        audio_path: The path or URL to the user's audio file.
        enhanced_transcript: The processed text from the audio file.
        api_key: The API key for the model.
        light_model: The model to use for enhancing transcription.
    """
    messages: Optional[List[Dict[str, Any]]]
    api_key: Optional[str]
    light_model: Optional[str]
    idea_proposition: Optional[IdeaProposition]


def generate_idea_proposition_node(state: IdeaPropositionGraphState):
    print("---NODE: Generate idea proposition NODE---")
    fernet_service = container.fernet_service()
    messages = state.get("messages")
    light_model = state.get("light_model") or "google/gemini-2.5-flash"

    encrypt_api_key = state.get("api_key") or None

    print(messages)

    if messages:
        context_parts = [
            f"{'Human' if m['type'] == 'human' else 'AI'}: {m['content']}"
            for m in messages
            if m['content'] and m['content'].strip()
        ]
        messages_str = "\n".join(context_parts)
    else:
        messages_str = "No context available."

    if encrypt_api_key:
        api_key = fernet_service.decrypt_data(encrypt_api_key)
    else:
        api_key = os.getenv("OPENROUTER_API_KEY")

    if not api_key:
        raise ValueError("API key is required. Set OPENROUTER_API_KEY environment variable or pass api_key in state.")

    try:
        prompt = f"""# Task: Based on the provided context, generate a comprehensive idea proposition with two key components: what and why. If you can't provide information for either component, leave it empty.

        # What: Describe the idea
        Provide a complete description of the idea that includes:
        - The core concept and what it fundamentally is (product/service/approach)
        - The main features and how it works
        - The specific problem it addresses or solves
        - The key aspects that define what this idea actually does

        # Why: Explain the importance
        Explain why this idea matters by covering:
        - Who this helps (target audience/users)
        - Why solving this problem is important
        - The impact or benefit it provides
        - The value and significance of this approach

        # Response output:
        {{what: "", why: ""}}

        Context:
        "{messages_str}"
        """
        open_router_model = container.openrouter_model(api_key=api_key, model=light_model)
        structured_llm = open_router_model.with_structured_output(IdeaProposition)

        idea_proposition: IdeaProposition = structured_llm.invoke(prompt)
        print(f"   > Idea proposition - what: '{idea_proposition.what[:100]}...'")

        return {
            "idea_proposition": idea_proposition,
            "messages": None,
            "api_key": None,
            "light_model": None,
        }

    except Exception as e:
        print(f"   > Error generating chat title: {e}")
        return {
            "idea_proposition": None,
            "messages": None,
            "api_key": None,
            "light_model": None,
        }
