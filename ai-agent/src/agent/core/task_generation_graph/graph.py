from langgraph.graph import StateGraph, END
from .data_models import TaskGenerationGraphState
from .nodes import generate_tasks_node

def create_task_generation_graph() -> StateGraph:
    """
    Create the task generation graph.

    Returns:
        Configured StateGraph for task generation
    """
    workflow = StateGraph(TaskGenerationGraphState)
    workflow.add_node("generate_tasks", generate_tasks_node)
    workflow.set_entry_point("generate_tasks")
    workflow.add_edge("generate_tasks", END)
    return workflow