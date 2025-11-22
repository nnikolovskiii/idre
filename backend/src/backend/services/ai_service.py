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
from backend.services.chat_model_service import ChatModelService
from backend.repositories.chat_repository import ChatRepository
from backend.repositories.thread_repository import ThreadRepository

load_dotenv()
LANGGRAPH_URL = os.getenv("LANGGRAPH_URL")
LANGGRAPH_WEBHOOK_URL = os.getenv("LANGGRAPH_WEBHOOK_URL")


class AIService:
    """
    Orchestrates chat-related business logic.

    This service coordinates interactions between external APIs (LangGraph),
    data access layers (repositories), and other business services.
    It is responsible for managing the overall transaction for complex operations.
    """

    def __init__(
            self,
            session: AsyncSession,
            model_api_service: ModelApiService,
            notebook_model_service: NotebookModelService,
            assistant_service: AssistantService,
    ):
        """
        Initializes the ChatService with all its dependencies.

        Args:
            session (AsyncSession): The request-scoped SQLAlchemy session, used for transaction control.
            chat_repository (ChatRepository): The repository for Chat data access.
            thread_repository (ThreadRepository): The repository for Thread data access.
            model_api_service (ModelApiService): Service for managing API keys.
            notebook_model_service (NotebookModelService): Service for managing notebook models.
            chat_model_service (ChatModelService): Service for managing chat models.
            assistant_service (AssistantService): Service for managing assistants.
        """
        self.session = session
        self.model_api_service = model_api_service
        self.notebook_model_service = notebook_model_service
        self.assistant_service = assistant_service
        self.langgraph_client = get_client(url=LANGGRAPH_URL)
        # Remove _assistant_id; we'll handle this per-method now for flexibility

    async def _get_assistant_id(self, graph_id: str) -> str:
        """Lazy loads the assistant ID for a given graph_id and returns it as a string."""
        print(f"DEBUG: Fetching assistant for graph_id '{graph_id}'...")
        assistant = await self.assistant_service.get_assistant_by_graph_id(graph_id)
        print(f"DEBUG: Got assistant: {assistant}")

        if assistant is None:
            raise ValueError(f"Assistant with graph_id '{graph_id}' not found.")

        print(f"DEBUG: Assistant ID: {assistant.assistant_id}")
        assistant_id = str(assistant.assistant_id)
        print(f"DEBUG: Returning assistant_id as string: {assistant_id}")

        return assistant_id

    async def transcribe_file(
            self,
            notebook_id: str,
            user_id: str,
            file_id: str,
            file_data: bytes,
            filename: str,
            content_type: str,  # <-- It's good practice to pass this too
            graph_id: str = "transcription_agent"
    ):
        """
        Initiates a LangGraph run to transcribe an in-memory audio file.

        This method encodes the raw audio data into Base64, then starts a
        stateless LangGraph run. The graph is responsible for decoding the
        data and calling the AI transcription service. A webhook is used
        to receive the result asynchronously.

        Args:
            notebook_id (str): ID of the notebook.
            user_id (str): ID of the user.
            file_id (str): The ID of the file record to be updated upon completion.
            file_data (bytes): The raw binary content of the audio file.
            filename (str): The original filename, used by the AI service.
            content_type (str): The MIME type of the audio file.
            graph_id (str): The graph ID for the assistant (e.g., "transcription_agent").
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

        encoded_audio_data = base64.b64encode(file_data).decode('utf-8')

        run_input = {
            "light_model": notebook_model.model.name,
            "api_key": model_api.value,
            "audio_data_base64": encoded_audio_data,
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
            metadata={"file_id": file_id, "temp_thread": True, "user_id": user_id},
            on_completion="keep",
        )

        return {"status": "started"}


    # Example: Add a new method for a different assistant (e.g., chat)
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

        # Require API key for all AI operations
        if not model_api:
            raise ValueError("API key is required to use this application. Please set up your API key in the settings.")

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

        # Require API key for all AI operations
        if not model_api:
            raise ValueError("API key is required to use this application. Please set up your API key in the settings.")

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

        # Require API key for all AI operations
        if not model_api:
            raise ValueError("API key is required to use this application. Please set up your API key in the settings.")

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
