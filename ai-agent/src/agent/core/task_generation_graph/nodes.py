from .config import settings
from .data_models import TaskGenerationGraphState, TaskGenerationResponse
from .prompts import task_generation_prompt
from .utils import get_api_key
from ...containers import container


def generate_tasks_node(state: TaskGenerationGraphState):
    print("---NODE: Generate Tasks---")
    text_input = state.get("text_input")
    light_model = state.get("light_model") or settings.DEFAULT_LIGHT_MODEL
    api_key = get_api_key(state.get("api_key"))

    try:
        open_router = container.openrouter_model(api_key=api_key, model=light_model)
        structured_llm = open_router.with_structured_output(TaskGenerationResponse)

        prompt = task_generation_prompt.format(text_input=text_input)
        response = structured_llm.invoke(prompt)

        # Convert TaskItem objects to dictionaries
        tasks_dict = []
        for task in response.tasks:
            task_dict = {
                "title": task.title,
                "description": task.description,
                "priority": task.priority,
                "tags": task.tags,
                "status": "todo",  # Always set to "todo" for new tasks
                "position": len(tasks_dict),  # Set position based on order
            }
            tasks_dict.append(task_dict)

        return {
            "generated_tasks": tasks_dict,
            "text_input": None
        }
    except Exception as e:
        print(f"Error generating tasks: {e}")
        return {
            "generated_tasks": [{
                "title": "Error: Could not generate tasks",
                "description": str(e),
                "priority": "medium",
                "tags": ["error"],
                "status": "todo",
                "position": 0
            }],
            "text_input": None
        }