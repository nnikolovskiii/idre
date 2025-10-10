import os

from dotenv import load_dotenv
from langgraph_sdk import get_client
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.dtos.chat import SendMessageRequest
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
        self._assistant_id = None

    async def _get_assistant_id(self) -> str:
        """Lazy loads the assistant ID and returns it as a string."""
        if self._assistant_id is None:
            print("DEBUG: Fetching assistant...")
            assistant = await self.assistant_service.get_assistant_by_graph_id("transcription_agent")
            print(f"DEBUG: Got assistant: {assistant}")

            if assistant is None:
                raise ValueError("Assistant with graph_id 'chat_agent' not found.")

            print(f"DEBUG: Assistant ID: {assistant.assistant_id}")
            self._assistant_id = str(assistant.assistant_id)
            print(f"DEBUG: Stored assistant_id as string: {self._assistant_id}")

        return self._assistant_id

    async def transcribe_file(self, notebook_id: str, user_id: str, request: SendMessageRequest):
        """
        Orchestrates sending a message by gathering all data and invoking LangGraph.
        """

        notebook_model = await self.notebook_model_service.get_notebook_model_by_id_and_type(notebook_id=notebook_id, model_type="light", user_id=user_id)

        if not notebook_model:
            raise ValueError(f"No notebook model found for: {notebook_id}")

        model_api = await self.model_api_service.get_api_key_by_user_id(user_id)

        run_input = {
            "light_model":notebook_model.model.name,
            "api_key": model_api.value if model_api else None,
        }

        if request.audio_path:
            run_input["audio_path"] = request.audio_path

        assistant_id = await self._get_assistant_id()

        # Start background run with webhook for completion notification
        webhook_url = LANGGRAPH_WEBHOOK_URL
        # In your transcribe_file or wherever you start the run
        background_run = await self.langgraph_client.runs.create(
            thread_id=None,  # Stateless
            assistant_id=assistant_id,
            input=run_input,
            webhook=webhook_url,
            metadata={"file_id": request.file_id, "temp_thread": True},  # Flag for cleanup
            on_completion="keep",  # Preserve thread for webhook fetch
        )

        return { "status": "started"}

        # final_state = await self.langgraph_client.runs.wait(
        #     thread_id=None,
        #     assistant_id=assistant_id,
        #     input=run_input,
        # )
        #
        # print("lol")
