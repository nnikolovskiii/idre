from .config import settings
from .data_models import FileNameGraphState, FileName
from .prompts import file_name_prompt
from .utils import get_api_key
from ...containers import container


def generate_file_name_node(state: FileNameGraphState):
    print("---NODE: Generate File Name---")
    doc_content = state.get("doc_content")
    light_model = state.get("light_model") or settings.DEFAULT_LIGHT_MODEL
    api_key = get_api_key(state.get("api_key"))

    try:
        open_router = container.openrouter_model(api_key=api_key, model=light_model)
        structured_llm = open_router.with_structured_output(FileName)

        prompt = file_name_prompt.format(doc_content=doc_content)
        response = structured_llm.invoke(prompt)

        return {
            "file_name": response.file_name,
            "doc_content": None
        }
    except Exception as e:
        print(f"Error generating file name: {e}")
        return {
            "file_name": None,
            "doc_content": None
        }