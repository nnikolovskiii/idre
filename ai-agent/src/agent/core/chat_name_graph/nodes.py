from .config import settings
from .data_models import ChatNameGraphState, ChatTitleResponse
from .prompts import chat_title_prompt
from .utils import get_api_key
from ...containers import container


def generate_chat_name_node(state: ChatNameGraphState):
    print("---NODE: Generate Chat Name---")
    first_message = state.get("first_message")
    light_model = state.get("light_model") or settings.DEFAULT_LIGHT_MODEL
    api_key = get_api_key(state.get("api_key"))

    try:
        open_router = container.openrouter_model(api_key=api_key, model=light_model)
        structured_llm = open_router.with_structured_output(ChatTitleResponse)

        prompt = chat_title_prompt.format(first_message=first_message)
        response = structured_llm.invoke(prompt)

        return {
            "title": response.title,
            "first_message": None
        }
    except Exception as e:
        print(f"Error generating title: {e}")
        return {
            "title": "Chat",
            "first_message": None
        }