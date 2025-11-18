from .config import settings
from .data_models import IdeaPropositionGraphState, IdeaProposition
from .prompts import idea_prop_prompt
from .utils import get_api_key
from ...containers import container


def generate_idea_proposition_node(state: IdeaPropositionGraphState):
    print("---NODE: Generate Idea Proposition---")
    messages = state.get("messages", [])
    light_model = state.get("light_model") or settings.DEFAULT_LIGHT_MODEL
    api_key = get_api_key(state.get("api_key"))

    context_str = "No context available."
    if messages:
        parts = [f"{'Human' if m.get('type') == 'human' else 'AI'}: {m.get('content')}"
                 for m in messages if m.get('content')]
        context_str = "\n".join(parts)

    try:
        open_router = container.openrouter_model(api_key=api_key, model=light_model)
        structured_llm = open_router.with_structured_output(IdeaProposition)

        prompt = idea_prop_prompt.format(context=context_str)
        response = structured_llm.invoke(prompt)

        return {
            "idea_proposition": response,
            "messages": None
        }
    except Exception as e:
        print(f"Error: {e}")
        return {
            "idea_proposition": None,
            "messages": None
        }