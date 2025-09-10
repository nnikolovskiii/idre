from __future__ import annotations

import os

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from pydantic import BaseModel, Field

from .ai_models import kimi_llm, gemini_flash_lite, open_router_model, gpt5
from .state import State
from ..prompts.prompts import final_context_instruction, make_plan_instruction, input_type_determination_prompt, \
    answer_question_prompt, commit_message_instruction
from ..tools.file_utils import get_project_structure_as_string, concat_files_in_str, concat_agent_metadata
from ..models.models import FileReflectionList, SearchFilePathsList
from ..prompts.prompts import file_planner_instructions, file_reflection_instructions
from ..utils.git_tools import git_commit_push

load_dotenv()



def llm_file_explore(state: State):
    """
    Transcribes audio, then uses the text to find relevant files.
    """
    user_task = state["user_task"]
    project_path = state["project_path"]

    project_structure = get_project_structure_as_string(project_path)
    structured_llm = gemini_flash_lite.with_structured_output(SearchFilePathsList)

    formatted_prompt = file_planner_instructions.format(
        user_task=user_task,
        project_structure=project_structure,
        project_path=project_path,
    )

    print("Invoking LLM to find relevant file paths...")
    result: SearchFilePathsList = structured_llm.invoke(formatted_prompt)
    filtered_file_paths = [path for path in result.file_paths if not path.endswith('.env')]
    context = concat_files_in_str(filtered_file_paths)
    return {"context": context, "all_file_paths": set(filtered_file_paths), "project_path": project_path,
            "project_structure": project_structure}


def llm_call_evaluator(state: State):
    """LLM evaluates the files in context and suggests additions/removals"""
    user_task = state["user_task"]
    project_path = state["project_path"]
    context = state["context"]
    all_file_paths = state["all_file_paths"]

    # Filter out .env files from all_file_paths
    all_file_paths = {path for path in all_file_paths if not path.endswith('.env')}

    project_structure = get_project_structure_as_string(project_path)
    count = 0

    while True:
        structured_llm = gemini_flash_lite.with_structured_output(FileReflectionList)
        formatted_prompt = file_reflection_instructions.format(
            user_task=state["user_task"],
            project_structure=project_structure,
            context=context,
            project_path=project_path,

        )
        count += 1
        if count > 3:
            return {"context": context}

        try:
            result: FileReflectionList = structured_llm.invoke(formatted_prompt)
            print(result)

            if result is None or result.additional_file_paths is None:
                break
        except Exception as e:
            print(f"Error in llm_call_evaluator: {e}")
            break
        new_files = [file_path for file_path in result.additional_file_paths if file_path not in all_file_paths]

        if len(new_files) == 0:
            break
        else:
            filtered_new_files = [path for path in new_files if not path.endswith('.env') and "agent_metadata.md" not in path]
            all_file_paths.update(set(filtered_new_files))
            context = concat_files_in_str(list(all_file_paths))

    print("*************************************")
    print(all_file_paths)
    return {"file_reflection": result, "context": context}


def build_context(state: State):
    """LLM evaluates the files in context and suggests additions/removals"""
    project_structure = state["project_structure"]
    context = state["context"]
    project_path = state["project_path"]

    agent_metadata = concat_agent_metadata(project_path)

    final_context = final_context_instruction.format(
        context=context,
        project_structure=project_structure,
        project_path=project_path,
    )

    output_path = os.path.join(os.getcwd(), 'context.txt')
    with open(output_path, 'w', encoding='utf-8') as output_file:
        output_file.write(final_context)
    return {"context": final_context, "agent_metadata": agent_metadata}


def determine_input_type(state: State):
    """Determine if the user input is a question or a task using the Kimi model"""
    user_input = state["user_task"]

    # Format the prompt with the user input
    formatted_prompt = input_type_determination_prompt.format(
        user_input=user_input
    )

    print("Invoking LLM to determine if input is a question or task...")
    result = kimi_llm.invoke(formatted_prompt)

    # Parse the response to determine if it's a question or task
    response_text = result.content.lower()

    # Simple heuristic: if the response contains "question", classify as question
    if "question" in response_text:
        input_type = "question"
    else:
        input_type = "task"

    print(f"Determined input type: {input_type}")

    return {"input_type": input_type}


def answer_question(state: State):
    """Answer a question using the Kimi model"""
    user_input = state["user_task"]
    context = state.get("context", "")

    # Format the prompt with the user input and context
    formatted_prompt = answer_question_prompt.format(
        user_input=user_input,
        context=context
    )

    print("Invoking LLM to answer the question...")
    result = kimi_llm.invoke(formatted_prompt)

    # Save the answer to a file
    output_path = os.path.join(os.getcwd(), 'answer.md')
    with open(output_path, 'w', encoding='utf-8') as output_file:
        output_file.write(result.content)

    return {"messages": [HumanMessage(content=result.content)], "answer": result.content}


def make_plan(state: State):
    """Plan the changes"""
    user_task = state["user_task"]
    context = state["context"]
    agent_metadata = state["agent_metadata"]


    instruction = make_plan_instruction.format(
        user_task=user_task,
        context=context,
        agent_metadata=agent_metadata
    )

    result = gpt5.invoke(instruction)
    output_path = os.path.join(os.getcwd(), 'example.md')
    with open(output_path, 'w', encoding='utf-8') as output_file:
        output_file.write(result.content)

    plan = result.content.split("</think>")[-1]

    return {"messages": [HumanMessage(content=result.content)], "plan": plan}

class CommitMessage(BaseModel):
    message: str = Field(..., description="Commit message")


def push_to_git(state: State):
    """Push to git"""
    user_task = state["user_task"]


    structured_model = gemini_flash_lite.with_structured_output(CommitMessage)
    formatted_prompt = commit_message_instruction.format(
        user_task=user_task,
    )

    commit_message = structured_model.invoke(formatted_prompt)

    git_commit_push("/home/nnikolovskii/notes", commit_message.message)

    return {}
