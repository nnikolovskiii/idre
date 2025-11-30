import os
from datetime import datetime, timezone
from typing import List, Optional

from dotenv import load_dotenv
from langgraph_sdk import get_client
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.chat import Chat
from backend.models.dtos.chat import SendMessageRequest, CreateThreadRequest
from backend.models.notebook_model import NotebookModel
from backend.repositories.notebook_repository import NotebookRepository
from backend.services.ai_service import AIService
from backend.services.assistant_service import AssistantService
from backend.services.file_service import FileService
from backend.services.model_api_service import ModelApiService
from backend.services.notebook_model_service import NotebookModelService
from backend.services.chat_model_service import ChatModelService
from backend.repositories.chat_repository import ChatRepository
from backend.repositories.thread_repository import ThreadRepository

load_dotenv()
LANGGRAPH_URL = os.getenv("LANGGRAPH_URL")
webhook_url = os.getenv("LANGGRAPH_WEBHOOK_URL") + "/chat-response"


class ChatService:
    """
    Orchestrates chat-related business logic.

    This service coordinates interactions between external APIs (LangGraph),
    data access layers (repositories), and other business services.
    It is responsible for managing the overall transaction for complex operations.
    """

    def __init__(
            self,
            session: AsyncSession,
            chat_repository: ChatRepository,
            thread_repository: ThreadRepository,
            notebook_repository: NotebookRepository,
            model_api_service: ModelApiService,
            notebook_model_service: NotebookModelService,
            chat_model_service: ChatModelService,
            assistant_service: AssistantService,
            file_service: FileService,
            ai_service: AIService
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
            file_service (FileService): Service for handling file operations.
            ai_service (AIService): Service for AI-related tasks.
        """
        self.session = session
        self.chat_repo = chat_repository
        self.thread_repo = thread_repository
        self.notebook_repo = notebook_repository
        self.model_api_service = model_api_service
        self.notebook_model_service = notebook_model_service
        self.chat_model_service = chat_model_service
        self.assistant_service = assistant_service
        self.langgraph_client = get_client(url=LANGGRAPH_URL)
        self.file_service = file_service
        self._assistant_ids = {}  # Cache for assistant IDs by mode
        self.ai_service = ai_service

    async def _get_assistant_id(self, mode: str) -> str:
        """
        Lazy loads the assistant ID for a given mode and returns it as a string.

        Args:
            mode (str): The mode of operation, e.g., "brainstorm" or "consult".

        Returns:
            str: The assistant ID as a string.

        Raises:
            ValueError: If the mode is invalid or the corresponding assistant is not found.
        """
        graph_id_map = {
            "brainstorm": "brainstorm_graph",
            "consult": "chat_agent",
            "analyser" : "pros_cons_graph",
            "questioner": "questioner_graph"
        }

        graph_id = graph_id_map.get(mode)
        if not graph_id:
            raise ValueError(f"Invalid mode specified: '{mode}'. Valid modes are: {list(graph_id_map.keys())}")

        # Check cache first
        if self._assistant_ids.get(mode) is None:
            print(f"DEBUG: Fetching assistant for mode '{mode}' with graph_id '{graph_id}'...")
            assistant = await self.assistant_service.get_assistant_by_graph_id(graph_id)
            print(f"DEBUG: Got assistant: {assistant}")

            if assistant is None:
                raise ValueError(f"Assistant with graph_id '{graph_id}' not found for mode '{mode}'.")

            assistant_id_str = str(assistant.assistant_id)
            print(f"DEBUG: Assistant ID: {assistant_id_str}")
            self._assistant_ids[mode] = assistant_id_str
            print(f"DEBUG: Stored assistant_id for mode '{mode}': {self._assistant_ids[mode]}")

        return self._assistant_ids[mode]

    # --- LangGraph Methods (External API Interaction) ---

    async def get_messages_for_thread(self, thread_id: str) -> List[dict]:
        """Gets all messages from a thread in LangGraph."""
        thread_state = await self.langgraph_client.threads.get_state(thread_id=thread_id, )
        return thread_state.get('values', {}).get('messages', [])

    async def delete_message_from_thread(self, thread_id: str, message_id_to_delete: str):
        """Deletes a message from a thread in LangGraph by replacing the state."""
        current_state = await self.langgraph_client.threads.get_state(thread_id=thread_id)
        current_messages = current_state.get('values', {}).get('messages', [])
        new_messages_list = [msg for msg in current_messages if msg.get('id') != message_id_to_delete]
        await self.langgraph_client.threads.update_state(
            thread_id=thread_id,
            values={"messages": {"$replace": new_messages_list}}
        )

    async def create_new_chat_and_thread(
            self, user_id: str, request: CreateThreadRequest
    ) -> Chat:
        """
        Orchestrates creating a chat, its thread, and default models in a single transaction.
        """
        # 1. Interact with external LangGraph API to create a thread
        thread = await self.langgraph_client.threads.create()
        thread_id = thread['thread_id']

        # Determine initial title
        # If audio is present but no text, default to "Audio Chat" temporarily
        initial_title = request.title
        if not request.text and request.audio_path:
            initial_title = "Audio Chat"

        new_chat = await self.chat_repo.create(
            user_id=user_id,
            thread_id=thread_id,
            notebook_id=request.notebook_id,
            title=initial_title,
            web_search=request.web_search
        )

        # 2. Update Notebook Timestamp
        if request.notebook_id:
            await self.notebook_repo.update(
                str(request.notebook_id),
                {"updated_at": datetime.now(timezone.utc)}
            )

        # 3. Generate Chat Name (Only if text is provided)
        # If it's an audio start, we skip this to avoid errors with empty text inputs.
        if request.text and request.text.strip():
            try:
                await self.ai_service.generate_chat_name(
                    request.notebook_id,
                    user_id,
                    SendMessageRequest(
                        first_message=request.text,
                        chat_id=str(new_chat.chat_id),
                        mode=request.mode,
                        sub_mode=request.sub_mode
                    )
                )
            except Exception as e:
                print(f"Error generating chat name: {e}")

        await self.session.flush()

        # Track created models for potential later refresh
        created_models = []

        # 4. Get notebook models if notebook_id is provided
        if request.notebook_id:
            notebook_light_model = await self.notebook_model_service.get_notebook_model_by_id_and_type(
                notebook_id=request.notebook_id, model_type="light", user_id=user_id
            )
            notebook_heavy_model = await self.notebook_model_service.get_notebook_model_by_id_and_type(
                notebook_id=request.notebook_id, model_type="heavy", user_id=user_id
            )

            # 5. Create chat models based on notebook models
            if notebook_light_model:
                await self.chat_model_service.create_ai_model(
                    user_id=user_id,
                    chat_id=new_chat.chat_id,
                    generative_model_id=str(notebook_light_model.generative_model_id)
                )

            if notebook_heavy_model:
                await self.chat_model_service.create_ai_model(
                    user_id=user_id,
                    chat_id=new_chat.chat_id,
                    generative_model_id=str(notebook_heavy_model.generative_model_id)
                )

        # 6. Single commit for everything
        await self.session.commit()

        # 7. Refresh the main chat object
        await self.session.refresh(new_chat)

        return new_chat

    async def send_message_to_graph(self, thread_id: str, user_id: str, request: SendMessageRequest):
        """
        Orchestrates sending a message by gathering all data and invoking LangGraph.
        """
        chat_obj = await self.chat_repo.get_by_thread_id(thread_id=thread_id)
        if not chat_obj:
            raise ValueError(f"No chat found for thread_id: {thread_id}")

        # --- Update Notebook Timestamp (Send Message) ---
        if chat_obj.notebook_id:
            await self.notebook_repo.update(
                str(chat_obj.notebook_id),
                {"updated_at": datetime.now(timezone.utc)}
            )
            # Commit the timestamp update immediately so it persists even if the LangGraph run takes time
            await self.session.commit()

        models_dict = {chat_model.model.type: chat_model.model.name for chat_model in chat_obj.models}
        model_api = await self.model_api_service.get_api_key_by_user_id(user_id)

        # Require API key for all chat operations
        if not model_api:
            raise ValueError("API key is required to use this application. Please set up your API key in the settings.")

        run_input = {
            "light_model": models_dict.get("light"),
            "heavy_model": models_dict.get("heavy"),
            "api_key": model_api.value,
            "web_search": chat_obj.web_search,
        }

        # if not chat_obj.started:
        #     files_contents = await self.file_service.get_notebook_files_content(user_id, str(chat_obj.notebook_id))
        #     run_input["files_contents"] = files_contents
        #     chat_obj.started = True

        if request.message:
            run_input["text_input"] = request.message
        if request.audio_path:
            run_input["audio_path"] = request.audio_path
        if request.sub_mode:
            run_input["sub_mode"] = request.sub_mode

        assistant_id = await self._get_assistant_id(request.mode.lower())

        metadata = {"user_id": user_id, "mode": request.mode, "notebook_id": str(chat_obj.notebook_id),}
        if request.sub_mode:
            metadata["sub_mode"] = request.sub_mode
        if request.generation_context:
            metadata["generation_context"] = request.generation_context

        background_run = await self.langgraph_client.runs.create(
            thread_id=thread_id,
            assistant_id=assistant_id,
            input=run_input,
            webhook=webhook_url,
            metadata=metadata,
        )

    async def get_chats_for_user(self, user_id: str, notebook_id: Optional[str] = None) -> List[Chat]:
        """Gets all chats for a user by calling the repository."""
        return await self.chat_repo.list_by_user_id(user_id, notebook_id)

    async def get_chat_by_id(self, chat_id: str) -> Optional[Chat]:
        """Gets a chat by its ID by calling the repository."""
        return await self.chat_repo.get_by_id(chat_id)

    async def update_chat(self, chat: Chat) -> Chat:
        """Updates a chat by calling the repository."""
        updated_chat = await self.chat_repo.update(chat)
        await self.session.commit()
        return updated_chat

    async def delete_chat(self, chat_id: str) -> bool:
        """
        Deletes a chat from the database in a transaction.
        Note: This could be expanded to also delete the thread from LangGraph.
        """
        was_deleted = await self.chat_repo.delete_by_id(chat_id)
        if was_deleted:
            await self.session.commit()
        return was_deleted

    async def toggle_web_search(self, chat_id: str, enabled: bool) -> Optional[Chat]:
        """
        Enables or disables the web search feature for a specific chat.

        Args:
            chat_id (str): The ID of the chat to update.
            enabled (bool): The new status for web search (True for enabled, False for disabled).

        Returns:
            The updated Chat object if found, otherwise None.
        """
        chat_obj = await self.chat_repo.get_by_id(chat_id)
        if not chat_obj:
            return None  # The controller will handle the 404 response

        chat_obj.web_search = enabled
        updated_chat = await self.chat_repo.update(chat_obj)
        await self.session.commit()
        await self.session.refresh(updated_chat)
        return updated_chat
