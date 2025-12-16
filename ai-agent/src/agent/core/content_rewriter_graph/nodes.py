from .config import settings
from .data_models import ContentRewriterGraphState, ContentRewriterResponse
from .prompts import content_rewriter_prompt
from .utils import get_api_key
from ...containers import container


def rewrite_content_node(state: ContentRewriterGraphState):
    print("---NODE: Rewrite Content---")
    original_content = state.get("original_content")
    light_model = state.get("light_model") or settings.DEFAULT_LIGHT_MODEL
    api_key = get_api_key(state.get("api_key"))

    try:
        open_router = container.openrouter_model(api_key=api_key, model=light_model)
        structured_llm = open_router.with_structured_output(ContentRewriterResponse)

        prompt = content_rewriter_prompt.format(original_content=original_content)
        response = structured_llm.invoke(prompt)

        return {
            "rewritten_content": response.rewritten_content,
            "original_content": None
        }
    except Exception as e:
        print(f"Error rewriting content: {e}")
        return {
            "rewritten_content": original_content or "Error: Could not rewrite content",
            "original_content": None
        }