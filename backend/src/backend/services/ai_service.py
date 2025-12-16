# backend/services/ai_service.py

import base64
import os
from typing import List

from dotenv import load_dotenv
from langgraph_sdk import get_client
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.dtos.chat import SendMessageRequest, MessageResponse
from backend.services.assistant_service import AssistantService
from backend.services.model_api_service import ModelApiService
from backend.services.notebook_model_service import NotebookModelService

load_dotenv()
LANGGRAPH_URL = os.getenv("LANGGRAPH_URL")
LANGGRAPH_WEBHOOK_URL = os.getenv("LANGGRAPH_WEBHOOK_URL")


class AIService:
    """
    Orchestrates chat-related business logic.
    """

    def __init__(
            self,
            session: AsyncSession,
            model_api_service: ModelApiService,
            notebook_model_service: NotebookModelService,
            assistant_service: AssistantService,
    ):
        self.session = session
        self.model_api_service = model_api_service
        self.notebook_model_service = notebook_model_service
        self.assistant_service = assistant_service
        self.langgraph_client = get_client(url=LANGGRAPH_URL)

    async def _get_assistant_id(self, graph_id: str) -> str:
        """Lazy loads the assistant ID for a given graph_id."""
        assistant = await self.assistant_service.get_assistant_by_graph_id(graph_id)
        if assistant is None:
            raise ValueError(f"Assistant with graph_id '{graph_id}' not found.")
        return str(assistant.assistant_id)

    async def transcribe_file(
            self,
            notebook_id: str,
            user_id: str,
            file_id: str,
            file_url: str,  # <--- Changed from bytes/base64 to URL
            filename: str,
            content_type: str,
            graph_id: str = "transcription_agent",
            target_file_id: str = None,  # <--- 1. Add this parameter
    ):
        """
        Initiates a LangGraph run to transcribe a file hosted at the given URL.
        """
        notebook_model = await self.notebook_model_service.get_notebook_model_by_id_and_type(
            notebook_id=notebook_id,
            model_type="light",
            user_id=user_id
        )

        if not notebook_model:
            raise ValueError(f"No notebook model found for: {notebook_id}")

        model_api = await self.model_api_service.get_api_key_by_user_id(user_id)

        # Require API key for all AI operations
        if not model_api:
            raise ValueError("API key is required to use this application. Please set up your API key in the settings.")

        # Input to the Agent: It should download the file from the file_url
        run_input = {
            "light_model": notebook_model.model.name,
            "api_key": model_api.value,
            "file_url": file_url,  # <--- Passing S3 URL
            "filename": filename,
            "content_type": content_type
        }

        assistant_id = await self._get_assistant_id(graph_id)
        webhook_url = LANGGRAPH_WEBHOOK_URL + "/transcription-hook"

        background_run = await self.langgraph_client.runs.create(
            thread_id=None,
            assistant_id=assistant_id,
            input=run_input,
            webhook=webhook_url,
            metadata={
                "file_id": file_id,
                "temp_thread": True,
                "user_id": user_id,
                "notebook_id": notebook_id,
                "target_file_id": target_file_id
            },
            on_completion="keep",
        )

        return {"status": "started"}

    async def generate_chat_name(
            self,
            notebook_id: str,
            user_id: str,
            request: SendMessageRequest,
            graph_id: str = "chat_name_agent"
    ):
        notebook_model = await self.notebook_model_service.get_notebook_model_by_id_and_type(
            notebook_id=notebook_id,
            model_type="light",
            user_id=user_id
        )

        if not notebook_model:
            raise ValueError(f"No notebook model found for: {notebook_id}")

        model_api = await self.model_api_service.get_api_key_by_user_id(user_id)

        if not model_api:
            raise ValueError("API key is required.")

        run_input = {
            "light_model": notebook_model.model.name,
            "api_key": model_api.value,
            "first_message": request.first_message,
        }

        assistant_id = await self._get_assistant_id(graph_id)

        background_run = await self.langgraph_client.runs.create(
            thread_id=None,
            assistant_id=assistant_id,
            input=run_input,
            webhook=LANGGRAPH_WEBHOOK_URL + "/chat-name-creation",
            metadata={"chat_id": request.chat_id, "temp_thread": True},
            on_completion="keep",
        )

        return {"status": "started"}

    async def generate_whiteboard_content(
            self,
            notebook_id: str,
            user_id: str,
            parent_content: str,
            node_type: str,
            generation_context: dict,
            graph_id: str = "chat_agent"
    ):
        notebook_model = await self.notebook_model_service.get_notebook_model_by_id_and_type(
            notebook_id=notebook_id,
            model_type="light",
            user_id=user_id
        )

        if not notebook_model:
            raise ValueError(f"No notebook model found for: {notebook_id}")

        model_api = await self.model_api_service.get_api_key_by_user_id(user_id)

        if not model_api:
            raise ValueError("API key is required.")

        run_input = {
            "light_model": notebook_model.model.name,
            "api_key": model_api.value,
            "text_input": parent_content,
            "mode": "brainstorm",
        }

        assistant_id = await self._get_assistant_id(graph_id)

        background_run = await self.langgraph_client.runs.create(
            thread_id=None,
            assistant_id=assistant_id,
            input=run_input,
            webhook=LANGGRAPH_WEBHOOK_URL + "/whiteboard-generation",
            metadata={
                "generation_context": generation_context,
                "temp_thread": True,
                "user_id": user_id,
                "notebook_id": notebook_id
            },
            on_completion="keep",
        )

        return {"status": "started"}

    async def generate_idea_proposition(
            self,
            notebook_id: str,
            user_id: str,
            messages: List[MessageResponse],
            graph_id: str = "idea_proposition_graph"
    ):
        notebook_model = await self.notebook_model_service.get_notebook_model_by_id_and_type(
            notebook_id=notebook_id,
            model_type="light",
            user_id=user_id
        )

        if not notebook_model:
            raise ValueError(f"No notebook model found for: {notebook_id}")

        model_api = await self.model_api_service.get_api_key_by_user_id(user_id)

        if not model_api:
            raise ValueError("API key is required.")

        run_input = {
            "light_model": notebook_model.model.name,
            "api_key": model_api.value,
            "messages": messages,
        }

        assistant_id = await self._get_assistant_id(graph_id)

        background_run = await self.langgraph_client.runs.create(
            thread_id=None,
            assistant_id=assistant_id,
            input=run_input,
            webhook=LANGGRAPH_WEBHOOK_URL + "/idea-proposition-hook",
            metadata={"notebook_id": str(notebook_id)},
            on_completion="keep",
        )

        return {"status": "started"}

    async def generate_file_name(
            self,
            notebook_id: str,
            user_id: str,
            doc_content: str,
            file_id: str,
            graph_id: str = "file_name_graph"
    ):
        notebook_model = await self.notebook_model_service.get_notebook_model_by_id_and_type(
            notebook_id=notebook_id,
            model_type="light",
            user_id=user_id
        )

        if not notebook_model:
            raise ValueError(f"No notebook model found for: {notebook_id}")

        model_api = await self.model_api_service.get_api_key_by_user_id(user_id)

        if not model_api:
            raise ValueError("API key is required.")

        run_input = {
            "light_model": notebook_model.model.name,
            "api_key": model_api.value,
            "doc_content": doc_content,
        }

        assistant_id = await self._get_assistant_id(graph_id)

        background_run = await self.langgraph_client.runs.create(
            thread_id=None,
            assistant_id=assistant_id,
            input=run_input,
            webhook=LANGGRAPH_WEBHOOK_URL + "/file-name-hook",
            metadata={"notebook_id": str(notebook_id), "file_id": file_id, "user_id": user_id},
            on_completion="keep",
        )

        return {"status": "started"}
    
    async def rewrite_content(
            self,
            notebook_id: str,
            user_id: str,
            original_content: str,
            file_id: str,
            graph_id: str = "content_rewriter_graph"
    ):
        """
        Initiates a LangGraph run to rewrite content for clarity and precision.
        """
        notebook_model = await self.notebook_model_service.get_notebook_model_by_id_and_type(
            notebook_id=notebook_id,
            model_type="light",
            user_id=user_id
        )

        if not notebook_model:
            raise ValueError(f"No notebook model found for: {notebook_id}")

        model_api = await self.model_api_service.get_api_key_by_user_id(user_id)

        if not model_api:
            raise ValueError("API key is required.")

        run_input = {
            "light_model": notebook_model.model.name,
            "api_key": model_api.value,
            "original_content": original_content,
        }

        assistant_id = await self._get_assistant_id(graph_id)

        background_run = await self.langgraph_client.runs.create(
            thread_id=None,
            assistant_id=assistant_id,
            input=run_input,
            webhook=LANGGRAPH_WEBHOOK_URL + "/content-rewriter-hook",
            metadata={
                "notebook_id": str(notebook_id),
                "user_id": user_id,
                "file_id": file_id
            },
            on_completion="keep",
        )

        return {"status": "started"}
