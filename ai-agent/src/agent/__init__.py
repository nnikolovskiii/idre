"""New LangGraph Agent.

This module defines a custom graph.
"""

# Core components
from .core.agent import llm_call, segment_into_steps, should_continue, tool_node
from .core.graph import build_context, llm_call_evaluator, llm_file_explore, make_plan
from .core.state import State

# Models
from .models.models import (
    EnhanceTextInstruction,
    FileReflectionList,
    Route,
    SearchFilePathsList,
)
from .models.schemas import Reflection, SearchQueryList
from .models.task_models import Task, TaskList

# Prompts
from .prompts.prompts import (
    agent_instruction,
    file_planner_instructions,
    file_reflection_instructions,
    final_context_instruction,
    final_instruction,
    get_current_date,
    make_plan_instruction,
    segment_plan_into_steps,
)
from .tools.file_utils import (
    concat_files_in_str,
    concat_folder_to_file,
    get_project_structure_as_string,
)

# Tools
from .tools.llm_tools import (
    create_file,
    llm_with_tools,
    run_bash_command,
    str_replace,
    view_file,
)
