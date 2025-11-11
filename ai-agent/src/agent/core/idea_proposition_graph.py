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
    service: str = Field(
        ...,
        description="A concise description of the product or service, including its core offering and key features. This should capture what the idea fundamentally provides to users."
    )
    audience: str = Field(
        ...,
        description="A detailed profile of the target audience, including demographics (e.g., age, location, profession), behaviors, needs, and pain points. Specify why this group is uniquely suited for the product/service."
    )
    problem: str = Field(
        ...,
        description="A clear articulation of the specific problem or challenge faced by the audience. Focus on the root cause, its impact on users' lives or work, and any existing gaps in current solutions."
    )
    solution: str = Field(
        ...,
        description="An explanation of the unique solution, highlighting innovative aspects, how it directly addresses the problem, and what differentiates it from existing alternatives (e.g., technology, process, or model used)."
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
        prompt = f"""# Task: Given the below context you need to fill out the form. If you can't provide one of these answers, just do not return anything for that question, leave it out.
        
        # The form:
        My idea is a product/service
        [Describe your core offering here: What is the product or service? Include its fundamental purpose, key features, and value it delivers to users. For example, "A mobile app that..." or "An online platform for..."]
        that solves a specific problem
        [Articulate the challenge: What exact pain point does your audience face? Detail the root cause, its real-world impact (e.g., time lost, costs incurred, frustrations felt), and why current solutions fall short.]
        for a specific audience
        [Profile your users: Who are they? Include demographics (age, location, job), behaviors (habits, tools they use), needs (what they crave), and why this group is the perfect fit for your idea.]
        by a unique solution.
        [Explain your innovation: How does it fix the problem? Highlight what makes it stand out (e.g., tech, process, or model), key differentiators from competitors, and measurable benefits (e.g., "reduces time by 50%").]

        # Response output: 
        {{service: "", audience: "", problem: "", solution: ""}}

        Context:
        "{messages_str}"
        """
        open_router_model = container.openrouter_model(api_key=api_key, model=light_model)
        structured_llm = open_router_model.with_structured_output(IdeaProposition)

        idea_proposition: IdeaProposition = structured_llm.invoke(prompt)
        print(f"   > Idea proposition: '{idea_proposition.service[:100]}...'")

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
