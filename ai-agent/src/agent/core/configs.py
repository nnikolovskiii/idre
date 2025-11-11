from langgraph.constants import END
from langgraph.graph import StateGraph

from agent.core.chat_graph.data_models import ChatGraphState
from agent.core.chat_graph.nodes import prepare_inputs_node, generate_answer_node
from agent.core.chat_name_graph import generate_chat_name_node, ChatNameGraphState
from agent.core.idea_proposition_graph import IdeaPropositionGraphState, generate_idea_proposition_node
from agent.core.transcription_graph import transcribe_and_enhance_audio_node, TranscriptionGraphState

from src.agent.core.brainstorm_graph import brainstorm_generate_answer, brainstorm_prepare_inputs


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


def brainstorm_graph():
    workflow = StateGraph(ChatGraphState)

    # Add just two nodes
    workflow.add_node("prepare_inputs", brainstorm_prepare_inputs)
    workflow.add_node("generate_answer", brainstorm_generate_answer)

    # The graph is now a simple, linear sequence
    workflow.set_entry_point("prepare_inputs")
    workflow.add_edge("prepare_inputs", "generate_answer")
    workflow.add_edge("generate_answer", END)

    return workflow


def transcription_graph():
    workflow = StateGraph(TranscriptionGraphState)

    workflow.add_node("transcribe_and_enhance_audio_node", transcribe_and_enhance_audio_node)

    workflow.set_entry_point("transcribe_and_enhance_audio_node")
    workflow.add_edge("transcribe_and_enhance_audio_node", END)

    return workflow


def chat_name_graph():
    workflow = StateGraph(ChatNameGraphState)

    workflow.add_node("generate_chat_name_node", generate_chat_name_node)

    workflow.set_entry_point("generate_chat_name_node")
    workflow.add_edge("generate_chat_name_node", END)

    return workflow


def idea_proposition_graph():
    workflow = StateGraph(IdeaPropositionGraphState)

    workflow.add_node("generate_idea_proposition_node", generate_idea_proposition_node)

    workflow.set_entry_point("generate_idea_proposition_node")
    workflow.add_edge("generate_idea_proposition_node", END)

    return workflow

# Build and compile transcription graph
transcription_builder = transcription_graph()
transcription_graph = transcription_builder.compile()

# Build and compile chat graph
chat_builder = simple_graph()
chat_graph = chat_builder.compile()

chat_name_builder = chat_name_graph()
chat_name_graph_compiled = chat_name_builder.compile()

brainstorm_builder = brainstorm_graph()
brainstorm_compiled_graph = brainstorm_builder.compile()

idea_proposition_builder = idea_proposition_graph()
idea_proposition_compiled_graph = idea_proposition_builder.compile()
