from langgraph.constants import START, END
from langgraph.graph import StateGraph
from typing import Literal

from agent.core.chat_graph_state import ChatGraphState
from src.agent.core.chat_graph import prepare_inputs_node, generate_answer_node
from src.agent.core.state import State
from src.agent.core.agent import llm_call, tool_node, should_continue, segment_into_steps, next_step
from src.agent.core.graph import llm_file_explore, llm_call_evaluator, build_context, make_plan, determine_input_type, \
    answer_question, push_to_git


def exploration():
    graph = StateGraph(State)
    graph.add_node("llm_file_explore", llm_file_explore)
    graph.add_node("llm_call_evaluator", llm_call_evaluator)
    graph.add_node("build_context", build_context)
    graph.add_node("make_plan", make_plan)

    graph.add_edge(START, "llm_file_explore")
    graph.add_edge("llm_file_explore", "llm_call_evaluator")
    graph.add_edge("llm_call_evaluator", "build_context")
    graph.add_edge("build_context", END)

    return graph


def exploration_and_plan():
    graph = StateGraph(State)

    graph.add_node("llm_file_explore", llm_file_explore)
    graph.add_node("llm_call_evaluator", llm_call_evaluator)
    graph.add_node("build_context", build_context)
    graph.add_node("make_plan", make_plan)

    graph.add_edge(START, "llm_file_explore")
    graph.add_edge("llm_file_explore", "llm_call_evaluator")
    graph.add_edge("llm_call_evaluator", "build_context")
    graph.add_edge("build_context", "make_plan")
    graph.add_edge("make_plan", END)

    return graph


def make_plan_run():
    graph = StateGraph(State)
    graph.add_edge(START, "make_plan")
    graph.add_node("make_plan", make_plan)
    return graph


def step_creation_part():
    graph = StateGraph(State)
    graph.add_node("segment_to_step", segment_into_steps)
    graph.add_edge(START, "segment_to_step")
    graph.add_edge("segment_to_step", END)
    return graph


def action():
    graph = StateGraph(State)
    graph.add_node("llm_call", llm_call)
    graph.add_node("environment", tool_node)
    graph.add_node("segment_into_steps", segment_into_steps)
    graph.add_node("next_step", next_step)


    graph.add_edge(START, "segment_into_steps")
    graph.add_edge("segment_into_steps", "llm_call")

    graph.add_conditional_edges(
        "llm_call",
        should_continue,
        {
            "Action": "environment",
            "next_step": "next_step",
            END: END,
        },
    )
    graph.add_edge("environment", "llm_call")
    graph.add_edge("next_step", "llm_call")

    return graph



def route_input(state: State) -> Literal["question", "task"]:
    """Route the workflow based on the input type determination"""
    input_type = state.get("input_type")
    return input_type


def explore_plan_action():
    graph = StateGraph(State)

    # Add nodes for input type determination and question answering
    graph.add_node("determine_input_type", determine_input_type)
    graph.add_node("answer_question", answer_question)

    # Add nodes for task processing
    graph.add_node("llm_call", llm_call)
    graph.add_node("environment", tool_node)
    graph.add_node("segment_into_steps", segment_into_steps)
    graph.add_node("next_step", next_step)
    graph.add_node("llm_file_explore", llm_file_explore)
    graph.add_node("llm_call_evaluator", llm_call_evaluator)
    graph.add_node("build_context", build_context)
    graph.add_node("make_plan", make_plan)
    graph.add_node("push_to_git", push_to_git)


    # Start with file exploration
    graph.add_edge(START, "llm_file_explore")
    graph.add_edge("llm_file_explore", "llm_call_evaluator")
    graph.add_edge("llm_call_evaluator", "build_context")

    # After context is built, determine input type
    graph.add_edge("build_context", "determine_input_type")

    # Add conditional edges based on input type
    graph.add_conditional_edges(
        "determine_input_type",
        route_input,
        {
            "question": "answer_question",
            "task": "make_plan",
        },
    )

    # Question answering path
    graph.add_edge("answer_question", END)
    graph.add_edge("make_plan", "segment_into_steps")
    graph.add_edge("segment_into_steps", "llm_call")

    graph.add_conditional_edges(
        "llm_call",
        should_continue,
        {
            "Action": "environment",
            "next_step": "next_step",
            "push_to_git": "push_to_git",
        },
    )
    graph.add_edge("environment", "llm_call")
    graph.add_edge("next_step", "llm_call")
    graph.add_edge("push_to_git", END)


    return graph


def simple_graph():
    workflow = StateGraph(ChatGraphState)

    # Add just two nodes
    workflow.add_node("prepare_inputs", prepare_inputs_node)
    workflow.add_node("generate_answer", generate_answer_node)

    # The graph is now a simple, linear sequence
    workflow.set_entry_point("prepare_inputs")
    workflow.add_edge("prepare_inputs", "generate_answer")
    workflow.add_edge("generate_answer", END)

    return workflow



optimizer_builder = simple_graph()
graph = optimizer_builder.compile()
