import os
from typing import Optional, List, Dict, Any

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from langgraph_sdk import get_client
from pydantic import BaseModel

from accounting_agent.models import User
from accounting_agent.api.routes.auth import get_current_user
from accounting_agent.container import container

router = APIRouter()
load_dotenv()
langgraph_url = os.getenv("LANGGRAPH_URL")


class ChatResponse(BaseModel):
    chat_id: str
    user_id: str
    thread_id: str
    created_at: str
    updated_at: str


class MessageResponse(BaseModel):
    id: str
    content: str
    type: str
    additional_kwargs: Optional[Dict[str, Any]] = None


class SendMessageRequest(BaseModel):
    message: Optional[str] = None
    audio_path: Optional[str] = None
    light_model: Optional[str] = None
    heavy_model: Optional[str] = None


class CreateThreadRequest(BaseModel):
    title: str


class UpdateAIModelsRequest(BaseModel):
    light_model: str
    heavy_model: str


class AIModelResponse(BaseModel):
    light_model: str
    heavy_model: str


@router.get("/get-all", response_model=List[ChatResponse])
async def get_chats(
        current_user: User = Depends(get_current_user),
):
    """
    Get all chats for the current user.
    """
    try:
        # Get chat service from container
        chat_service = container.chat_service()

        # Get chats for the current user
        chats = await chat_service.get_chats_for_user(str(current_user.user_id))

        # Convert to response format
        chat_responses = []
        for chat in chats:
            chat_responses.append(ChatResponse(
                chat_id=str(chat.chat_id),
                user_id=chat.user_id,
                thread_id=str(chat.thread_id),
                created_at=chat.created_at.isoformat() if chat.created_at else "",
                updated_at=chat.updated_at.isoformat() if chat.updated_at else ""
            ))

        return chat_responses
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving chats: {str(e)}")


@router.get("/{thread_id}/messages", response_model=List[MessageResponse])
async def get_thread_messages(
        thread_id: str,
        current_user: User = Depends(get_current_user)
):
    """
    Get messages from a langgraph thread for the current user.
    """
    try:
        # Initialize langgraph client
        client = get_client(url=langgraph_url)

        # Get the thread state
        thread_state = await client.threads.get_state(thread_id=thread_id)

        # Extract messages from the thread state
        messages = thread_state.get('values', {}).get('messages', [])

        # Convert to response format
        message_responses = []
        for message in messages:
            message_responses.append(MessageResponse(
                id=message.get('id', ''),
                content=message.get('content', ''),
                type=message.get('type', ''),
                additional_kwargs=message.get('additional_kwargs', {})
            ))

        return message_responses
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving messages: {str(e)}")


@router.post("/{thread_id}/send")
async def send_message_to_thread(
        thread_id: str,
        request: SendMessageRequest,
        current_user: User = Depends(get_current_user)
):
    """
    Send a message to a langgraph thread and get AI response.
    """
    ai_model_service = container.ai_model_service()
    chat_service = container.chat_service()

    try:
        # Initialize langgraph client
        client = get_client(url=langgraph_url)

        # Prepare the input
        run_input = {}

        if request.message:
            run_input["text_input"] = request.message

        if request.audio_path:
            run_input["audio_path"] = request.audio_path

        chat_obj = await chat_service.get_chat_by_thread_id(thread_id=thread_id)
        light_model = await ai_model_service.get_first_ai_model_by_chat_and_type(chat_id=chat_obj.chat_id,
                                                                                 model_type="light")
        heavy_model = await ai_model_service.get_first_ai_model_by_chat_and_type(chat_id=chat_obj.chat_id,
                                                                                 model_type="heavy")

        model_api_service = container.model_api_service()
        model_api = await model_api_service.get_api_key_by_user_id(str(current_user.user_id))
        encrypted_api_key = model_api.value

        run_input["light_model"] = light_model.name
        run_input["heavy_model"] = heavy_model.name
        run_input["api_key"] = encrypted_api_key

        # Validate that at least one input is provided
        if not request.message and not request.audio_path:
            raise HTTPException(status_code=400, detail="Either message or audio_path must be provided")

        # Use a default assistant_id - this should be configurable
        assistant_id = "fe096781-5601-53d2-b2f6-0d3403f7e9ca"

        # Send the message and wait for response
        await client.runs.wait(
            thread_id=thread_id,
            assistant_id=assistant_id,
            input=run_input,
        )

        return {"status": "success", "message": "Message sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending message: {str(e)}")


@router.post("/create-thread")
async def create_new_thread(
        request: CreateThreadRequest,
        current_user: User = Depends(get_current_user)
):
    """
    Create a new langgraph thread and chat session.
    """
    try:
        # Get services from container
        chat_service = container.chat_service()
        ai_model_service = container.ai_model_service()
        default_ai_service = container.default_ai_model_service()

        # Initialize langgraph client
        client = get_client(url=langgraph_url)

        # Create a new thread in langgraph
        thread = await client.threads.create()
        thread_id = thread['thread_id']

        # Create a corresponding thread record in our database
        try:
            db_thread = await chat_service.create_thread(thread_id=thread_id)
        except Exception as db_thread_error:
            # If we can't create the thread in our database, we should still proceed
            # but log the error for debugging
            print(f"Warning: Could not create thread record in database: {str(db_thread_error)}")

        # Create a new chat in the database
        new_chat = await chat_service.create_chat(
            user_id=str(current_user.user_id),
            thread_id=thread_id,
            title=request.title
        )

        light_name = await default_ai_service.get_name_by_type("light")
        heavy_name = await default_ai_service.get_name_by_type("heavy")
        await ai_model_service.create_ai_model(
            user_id=str(current_user.user_id),
            chat_id=new_chat.chat_id,
            name=light_name,
            type="light"
        )

        await ai_model_service.create_ai_model(
            user_id=str(current_user.user_id),
            chat_id=new_chat.chat_id,
            name=heavy_name,
            type="heavy"
        )

        return {
            "chat_id": str(new_chat.chat_id),
            "thread_id": thread_id,
            "title": request.title,
            "created_at": new_chat.created_at.isoformat() if new_chat.created_at else ""
        }
    except Exception as e:
        # More detailed error handling
        error_message = f"Error creating thread: {str(e)}"
        print(f"Thread creation error: {error_message}")
        raise HTTPException(status_code=500, detail=error_message)


@router.get("/{chat_id}/ai-models", response_model=AIModelResponse)
async def get_chat_ai_models(
        chat_id: str,
        current_user: User = Depends(get_current_user)
):
    """
    Get the AI models (light and heavy) for a specific chat.
    """
    try:
        # Get AI model service from container
        ai_model_service = container.ai_model_service()

        # Get AI models for the chat
        ai_models = await ai_model_service.get_ai_models_by_chat_id(chat_id)

        # Extract light and heavy models
        light_model = None
        heavy_model = None

        for model in ai_models:
            if model.type == "light":
                light_model = model.name
            elif model.type == "heavy":
                heavy_model = model.name

        if light_model is None or heavy_model is None:
            raise HTTPException(status_code=404, detail="AI models not found for this chat")

        return AIModelResponse(
            light_model=light_model,
            heavy_model=heavy_model
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving AI models: {str(e)}")


@router.put("/{chat_id}/ai-models")
async def update_chat_ai_models(
        chat_id: str,
        request: UpdateAIModelsRequest,
        current_user: User = Depends(get_current_user)
):
    """
    Update the AI models (light and heavy) for a specific chat.
    """
    try:
        # Get AI model service from container
        ai_model_service = container.ai_model_service()

        # Get existing AI models for the chat
        ai_models = await ai_model_service.get_ai_models_by_chat_id(chat_id)

        # Update light and heavy models
        for model in ai_models:
            if model.type == "light":
                await ai_model_service.update_ai_model(
                    model.ai_model_id,
                    {"name": request.light_model}
                )
            elif model.type == "heavy":
                await ai_model_service.update_ai_model(
                    model.ai_model_id,
                    {"name": request.heavy_model}
                )

        return {"status": "success", "message": "AI models updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating AI models: {str(e)}")


@router.delete("/{chat_id}")
async def delete_chat(
        chat_id: str,
        current_user: User = Depends(get_current_user)
):
    """
    Delete a chat and its associated thread and AI models.
    """
    try:
        # Get chat service from container
        chat_service = container.chat_service()

        # Delete the chat
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
        current_user: User = Depends(get_current_user)
):
    """
    Delete a specific message from a thread.
    """
    try:
        # Initialize langgraph client
        client = get_client(url=langgraph_url)

        # Call the delete function
        await delete_message_from_thread(client, thread_id, message_id)

        return {"status": "success", "message": "Message deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting message: {str(e)}")


async def delete_message_from_thread(client, thread_id: str, message_id_to_delete: str):
    """
      Creates a new checkpoint that effectively "deletes" a message by setting the thread's
      state to a version from before the message was added.
      """
    """
    Deletes a message using a custom reducer that supports a "$replace" command.
    """
    print(f"Attempting to replace state via custom reducer for thread '{thread_id}'...")

    try:
        current_state = await client.threads.get_state(thread_id=thread_id)
        current_messages = current_state.get('values', {}).get('messages', [])

        new_messages_list = [msg for msg in current_messages if msg.get('id') != message_id_to_delete]

        # IMPORTANT: Wrap the new list in the special dictionary format
        update_payload = {"messages": {"$replace": new_messages_list}}

        response = await client.threads.update_state(
            thread_id=thread_id,
            values=update_payload
        )
        print("Successfully sent replace command to custom reducer.")
        print("New Checkpoint Info:", response['checkpoint'])

    except Exception as e:
        print(f"An error occurred: {e}")


async def send_message(thread_id: str, assistant_id: str, text_input: str):
    client = get_client(url=langgraph_url)

    run_input = {
        # "audio_path": "https://files.nikolanikolovski.com/test/download/test_audio.ogg",
        "text_input": text_input
    }

    await client.runs.wait(
        thread_id=thread_id,
        assistant_id=assistant_id,
        input=run_input,
    )
