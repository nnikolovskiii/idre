import os
from typing import List, Optional

from dotenv import load_dotenv
from langgraph_sdk import get_client
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.chat import Chat
from backend.models.dtos.chat import SendMessageRequest, CreateThreadRequest
from backend.models.notebook_model import NotebookModel
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
        """
        self.session = session
        self.chat_repo = chat_repository
        self.thread_repo = thread_repository
        self.model_api_service = model_api_service
        self.notebook_model_service = notebook_model_service
        self.chat_model_service = chat_model_service
        self.assistant_service = assistant_service
        self.langgraph_client = get_client(url=LANGGRAPH_URL)
        self.file_service = file_service
        self._assistant_id = None
        self.ai_service = ai_service

    async def _get_assistant_id(self) -> str:
        """Lazy loads the assistant ID and returns it as a string."""
        if self._assistant_id is None:
            print("DEBUG: Fetching assistant...")
            assistant = await self.assistant_service.get_assistant_by_graph_id("chat_agent")
            print(f"DEBUG: Got assistant: {assistant}")

            if assistant is None:
                raise ValueError("Assistant with graph_id 'chat_agent' not found.")

            print(f"DEBUG: Assistant ID: {assistant.assistant_id}")
            self._assistant_id = str(assistant.assistant_id)
            print(f"DEBUG: Stored assistant_id as string: {self._assistant_id}")

        return self._assistant_id
    # --- LangGraph Methods (External API Interaction) ---

    async def get_messages_for_thread(self, thread_id: str) -> List[dict]:
        """Gets all messages from a thread in LangGraph."""
        thread_state = await self.langgraph_client.threads.get_state(thread_id=thread_id,)
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

        new_chat = await self.chat_repo.create(
            user_id=user_id, thread_id=thread_id, notebook_id=request.notebook_id, title=request.title
        )
        try:
            await self.ai_service.generate_chat_name(
                request.notebook_id,
                user_id,
                SendMessageRequest(first_message=request.text, chat_id=str(new_chat.chat_id))
            )
        except Exception as e:
            print(e)
        await self.session.flush()
        # Track created models for potential later refresh
        created_models = []

        # 3. Get notebook models if notebook_id is provided
        if request.notebook_id:
            notebook_light_model = await self.notebook_model_service.get_notebook_model_by_id_and_type(
                notebook_id=request.notebook_id, model_type="light", user_id=user_id
            )
            notebook_heavy_model = await self.notebook_model_service.get_notebook_model_by_id_and_type(
                notebook_id=request.notebook_id, model_type="heavy", user_id=user_id
            )

            # 4. Create chat models based on notebook models (no commits here)
            if notebook_light_model:
                light_model = await self.chat_model_service.create_ai_model(
                    user_id=user_id,
                    chat_id=new_chat.chat_id,
                    generative_model_id=str(notebook_light_model.generative_model_id)
                )
                created_models.append(light_model)

            if notebook_heavy_model:
                heavy_model = await self.chat_model_service.create_ai_model(
                    user_id=user_id,
                    chat_id=new_chat.chat_id,
                    generative_model_id=str(notebook_heavy_model.generative_model_id)
                )
                created_models.append(heavy_model)

        # 5. Single commit for everything
        await self.session.commit()

        # 6. Refresh the main chat object (and optionally the models if needed)
        await self.session.refresh(new_chat)
        # If you need refreshed model instances, uncomment and refresh them too:
        # for model in created_models:
        #     await self.session.refresh(model)

        return new_chat

    async def send_message_to_graph(self, thread_id: str, user_id: str, request: SendMessageRequest):
        """
        Orchestrates sending a message by gathering all data and invoking LangGraph.
        """
        chat_obj = await self.chat_repo.get_by_thread_id(thread_id=thread_id)
        if not chat_obj:
            raise ValueError(f"No chat found for thread_id: {thread_id}")

        models_dict = {chat_model.model.type: chat_model.model.name for chat_model in chat_obj.models}
        model_api = await self.model_api_service.get_api_key_by_user_id(user_id)

        run_input = {
            "light_model": models_dict.get("light"),
            "heavy_model": models_dict.get("heavy"),
            "api_key": model_api.value if model_api else None,
        }

        if not chat_obj.started:
            files_contents = await self.file_service.get_notebook_files_content(user_id, str(chat_obj.notebook_id))
            run_input["files_contents"] = files_contents
            chat_obj.started = True

        if request.message:
            run_input["text_input"] = request.message
        if request.audio_path:
            run_input["audio_path"] = request.audio_path

        assistant_id = await self._get_assistant_id()
        background_run = await self.langgraph_client.runs.create(
            thread_id=thread_id,
            assistant_id=assistant_id,
            input=run_input,
            webhook=webhook_url,  # Optional: For notification when done
            metadata={"user_id": user_id}  # Optional: Add custom metadata
        )

    # --- Data Retrieval and Deletion Methods (delegated to repository) ---

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