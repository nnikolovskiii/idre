from typing import Optional, List

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException

from backend.api.dependencies import get_chat_service
from backend.models import User
from backend.api.routes.auth import get_current_user
from backend.models.dtos.chat import ChatResponse, MessageResponse, SendMessageRequest, CreateThreadRequest
from backend.services.chat_service import ChatService

router = APIRouter()
load_dotenv()


@router.get("/all", response_model=List[ChatResponse])
async def get_chats(
        notebook_id: Optional[str] = None,
        current_user: User = Depends(get_current_user),
        chat_service: ChatService = Depends(get_chat_service)
):
    """
    Handles the HTTP request to get all chats for the current user.
    """
    try:
        chats = await chat_service.get_chats_for_user(str(current_user.user_id), notebook_id=notebook_id)


        return [
            ChatResponse(
                chat_id=str(chat.chat_id),
                user_id=chat.user_id,
                thread_id=str(chat.thread_id),
                created_at=chat.created_at,
                updated_at=chat.updated_at
            ) for chat in chats
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving chats: {str(e)}")


@router.get("/{thread_id}/messages", response_model=List[MessageResponse])
async def get_thread_messages(
        thread_id: str,
        chat_service: ChatService = Depends(get_chat_service)
):
    """
    Handles the HTTP request to get all messages for a specific thread.
    """
    try:
        messages = await chat_service.get_messages_for_thread(thread_id)

        return [
            MessageResponse(
                id=message.get('id', ''),
                content=message.get('content', ''),
                type=message.get('type', ''),
                additional_kwargs=message.get('additional_kwargs', {})
            ) for message in messages
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving messages: {str(e)}")


@router.post("/{thread_id}/send")
async def send_message_to_thread(
        thread_id: str,
        request: SendMessageRequest,
        current_user: User = Depends(get_current_user),
        chat_service: ChatService = Depends(get_chat_service)
):
    """
    Handles the HTTP request to send a message to a thread.
    """
    if not request.message and not request.audio_path:
        raise HTTPException(status_code=400, detail="Either message or audio_path must be provided")

    try:
        await chat_service.send_message_to_graph(
            thread_id=thread_id,
            user_id=str(current_user.user_id),
            request=request
        )
        return {"status": "success", "message": "Message sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending message: {str(e)}")


@router.post("/create-thread")
async def create_new_thread(
        request: CreateThreadRequest,
        current_user: User = Depends(get_current_user),
        chat_service: ChatService = Depends(get_chat_service)
):
    """
    Handles the HTTP request to create a new chat, including its LangGraph thread and default models.
    """
    try:
        new_chat = await chat_service.create_new_chat_and_thread(
            user_id=str(current_user.user_id),
            title=request.title,
            notebook_id=request.notebook_id
        )

        return {
            "chat_id": str(new_chat.chat_id),
            "thread_id": str(new_chat.thread_id),
            "title": request.title,
            "created_at": new_chat.created_at.isoformat() if new_chat.created_at else ""
        }
    except Exception as e:
        error_message = f"Error creating thread: {str(e)}"
        raise HTTPException(status_code=500, detail=error_message)


@router.delete("/{chat_id}")
async def delete_chat(
        chat_id: str,
        chat_service: ChatService = Depends(get_chat_service)
):
    """
    Handles the HTTP request to delete a chat.
    """
    try:
        deleted = await chat_service.delete_chat(chat_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Chat not found")

        return {"status": "success", "message": "Chat deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting chat: {str(e)}")


@router.delete("/{thread_id}/messages/{message_id}")
async def delete_message_from_thread_endpoint(
        thread_id: str,
        message_id: str,
        chat_service: ChatService = Depends(get_chat_service)
):
    """
    Handles the HTTP request to delete a specific message from a thread.
    """
    try:
        await chat_service.delete_message_from_thread(thread_id, message_id)
        return {"status": "success", "message": "Message deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting message: {str(e)}")