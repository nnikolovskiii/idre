from langgraph.constants import END
from langgraph.graph import StateGraph

# Chat Graph Imports
from agent.core.chat_graph.data_models import ChatGraphState
from agent.core.chat_graph.nodes import prepare_inputs_node as chat_prepare, generate_answer_node as chat_generate

# Brainstorm Graph Imports
from agent.core.brainstorm_graph.data_models import BrainstormGraphState
from agent.core.brainstorm_graph.nodes import prepare_inputs_node as brain_prepare, \
    generate_answer_node as brain_generate

# Questioner Graph Imports
from agent.core.questioner_graph.data_models import QuestionerGraphState
from agent.core.questioner_graph.nodes import prepare_inputs_node as quest_prepare, \
    generate_questions_node as quest_generate

# Transcription Graph Imports
from agent.core.transcription_graph.data_models import TranscriptionGraphState
from agent.core.transcription_graph.nodes import transcribe_and_enhance_audio_node

# Chat Name Graph Imports
from agent.core.chat_name_graph.data_models import ChatNameGraphState
from agent.core.chat_name_graph.nodes import generate_chat_name_node

# File Name Graph Imports
from agent.core.file_name_graph.data_models import FileNameGraphState
from agent.core.file_name_graph.nodes import generate_file_name_node

# Idea Proposition Graph Imports
from agent.core.idea_proposition_graph.data_models import IdeaPropositionGraphState
from agent.core.idea_proposition_graph.nodes import generate_idea_proposition_node

# Pros Cons Graph Imports
from agent.core.pros_cons_graph.data_models import ProsConsGraphState
from agent.core.pros_cons_graph.nodes import (
    pros_cons_prepare_inputs,
    pros_cons_generate_positive,
    pros_cons_generate_negative,
    pros_cons_combine_responses
)

# Content Rewriter Graph Imports
from agent.core.content_rewriter_graph.data_models import ContentRewriterGraphState
from agent.core.content_rewriter_graph.nodes import rewrite_content_node

# Task Generation Graph Imports
from agent.core.task_generation_graph.graph import create_task_generation_graph


def simple_graph():
    workflow = StateGraph(ChatGraphState)
    workflow.add_node("prepare_inputs", chat_prepare)
    workflow.add_node("generate_answer", chat_generate)
    workflow.set_entry_point("prepare_inputs")
    workflow.add_edge("prepare_inputs", "generate_answer")
    workflow.add_edge("generate_answer", END)
    return workflow


def brainstorm_graph():
    workflow = StateGraph(BrainstormGraphState)
    workflow.add_node("prepare_inputs", brain_prepare)
    workflow.add_node("generate_answer", brain_generate)
    workflow.set_entry_point("prepare_inputs")
    workflow.add_edge("prepare_inputs", "generate_answer")
    workflow.add_edge("generate_answer", END)
    return workflow


def questioner_graph():
    workflow = StateGraph(QuestionerGraphState)
    workflow.add_node("prepare_inputs", quest_prepare)
    workflow.add_node("generate_questions", quest_generate)
    workflow.set_entry_point("prepare_inputs")
    workflow.add_edge("prepare_inputs", "generate_questions")
    workflow.add_edge("generate_questions", END)
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


def file_name_graph():
    workflow = StateGraph(FileNameGraphState)
    workflow.add_node("generate_file_name", generate_file_name_node)
    workflow.set_entry_point("generate_file_name")
    workflow.add_edge("generate_file_name", END)
    return workflow


def pros_cons_graph():
    workflow = StateGraph(ProsConsGraphState)
    workflow.add_node("prepare_inputs", pros_cons_prepare_inputs)
    workflow.add_node("generate_positive", pros_cons_generate_positive)
    workflow.add_node("generate_negative", pros_cons_generate_negative)
    workflow.add_node("combine_responses", pros_cons_combine_responses)

    workflow.set_entry_point("prepare_inputs")
    workflow.add_edge("prepare_inputs", "generate_positive")
    workflow.add_edge("generate_positive", "generate_negative")
    workflow.add_edge("generate_negative", "combine_responses")
    workflow.add_edge("combine_responses", END)
    return workflow


def content_rewriter_graph():
    workflow = StateGraph(ContentRewriterGraphState)
    workflow.add_node("rewrite_content", rewrite_content_node)
    workflow.set_entry_point("rewrite_content")
    workflow.add_edge("rewrite_content", END)
    return workflow


def task_generation_graph():
    """Create and return the task generation graph"""
    return create_task_generation_graph()


# Compilation
chat_graph = simple_graph().compile()
brainstorm_compiled_graph = brainstorm_graph().compile()
questioner_compiled_graph = questioner_graph().compile()
transcription_graph_compiled = transcription_graph().compile()
chat_name_graph_compiled = chat_name_graph().compile()
idea_proposition_compiled_graph = idea_proposition_graph().compile()
file_name_compiled_graph = file_name_graph().compile()
pros_cons_compiled_graph = pros_cons_graph().compile()
content_rewriter_compiled_graph = content_rewriter_graph().compile()
task_generation_compiled_graph = task_generation_graph().compile()