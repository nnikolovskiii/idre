from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from langgraph_sdk import get_client
import os
from dotenv import load_dotenv
from pydantic import BaseModel
import json

from backend.api.dependencies import get_file_service, get_chat_service
from backend.models.file import ProcessingStatus
from backend.services.chat_service import ChatService
from backend.services.file_service import FileService
from fastapi import FastAPI, Request, BackgroundTasks
from backend.container import container

router = APIRouter()
load_dotenv()
LANGGRAPH_URL = os.getenv("LANGGRAPH_URL")

@router.post("/lol")
async def handle_langgraph_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    file_service: FileService = Depends(get_file_service),
) -> Dict[str, str]:
    """
    Receives the POST request that LangGraph sends when a run completes.
    Fetches final state if successful and updates the file.
    """
    langgraph_client = get_client(url=LANGGRAPH_URL)
    payload = await request.json()
    run_id = payload.get("run_id")
    status = payload.get("status")
    thread_id = payload.get("thread_id")
    metadata = payload.get("metadata", {})

    if not run_id or not thread_id:
        raise HTTPException(status_code=400, detail="Missing run_id or thread_id")

    try:
        if status == "success":
            # Fetch state (now safe with "keep")
            thread_state = await langgraph_client.threads.get_state(thread_id=thread_id)
            values = thread_state.get("values", {})

            file_id = metadata.get("file_id")
            user_id = metadata.get("user_id")

            if not file_id:
                raise HTTPException(status_code=400, detail="Missing file_id in metadata")

            transcription = values.get("enhanced_transcript")
            if not transcription:
                raise HTTPException(status_code=500, detail="No transcription in final state")

            await file_service.update_file(
                file_id=file_id,
                user_id=user_id,
                updates={
                    "processing_result": {"transcription": transcription},
                    "processing_status": ProcessingStatus.COMPLETED,
                    "content": transcription
                },
                merge_processing_result=True,
            )

            # # Manual cleanup: Queue deletion (non-blocking)
            # background_tasks.add_task(
            #     lambda tid=thread_id: langgraph_client.threads.delete(tid)
            # )  # Or await if sync is fine

        elif status == "error":
            error_details = payload.get("error", "Unknown error")
            print(f"Run {run_id} error: {error_details}")
            file_id = metadata.get("file_id")
            if file_id:
                await file_service.update_file(
                    file_id=file_id,
                    updates={
                        "processing_status": ProcessingStatus.FAILED,
                        "processing_result": {"error": error_details},
                        "content": "Error processing file"
                    },
                    merge_processing_result=True
                )
                # Still clean up thread
                background_tasks.add_task(
                    lambda tid=thread_id: langgraph_client.threads.delete(tid)
                )

        else:
            print(f"Run {run_id} incomplete: {status}")
            # Optional: Clean up anyway
            background_tasks.add_task(
                lambda tid=thread_id: langgraph_client.threads.delete(tid)
            )

    except HTTPException:
        raise  # Re-raise known errors
    except Exception as e:
        # Fallback: If get_state fails (e.g., race), log and retry via background task
        print(f"Failed to fetch state for {run_id}: {e}")
        # background_tasks.add_task(retry_fetch_and_update, langgraph_client, thread_id, file_id, status)
        # Define retry_fetch_and_update as a helper func elsewhere

    return {"received": "ok", "run_id": run_id}


class WebhookPayload(BaseModel):
    run_id: str
    thread_id: str
    status: str  # e.g., 'success', 'error'
    values: dict  # The final graph state or outputs

@router.post("/chat-response")
async def handle_langgraph_chat_response_webhook(
    request: Request,
) -> Dict[str, str]:
    redis_client = container.redis_client()
    
    try:
        payload = await request.json()
        validated_payload = WebhookPayload(**payload)

        run_id = validated_payload.run_id
        thread_id = validated_payload.thread_id
        status = validated_payload.status

        if status == "success":
            full_messages = validated_payload.values.get("messages", [])
            delta = full_messages[-1:] if full_messages else []

            event_data = {
                "event": "message_update",
                "data": {
                    "thread_id": thread_id,
                    "messages": full_messages,
                    "delta": delta,
                    "status": "completed",
                    "run_id": run_id
                }
            }

            # Publish to Redis channel for this thread
            channel = f"sse:thread:{thread_id}"
            event_json = json.dumps(event_data)
            sse_formatted = f"data: {event_json}\n\n"

            await redis_client.publish(channel, sse_formatted)
            print(f"Published SSE update to Redis channel {channel}")
        
        elif status == "error":
            error_data = {
                "event": "error",
                "data": {
                    "thread_id": thread_id,
                    "error": validated_payload.values.get("error", "Unknown error")
                }
            }
            channel = f"sse:thread:{thread_id}"
            sse_formatted = f"data: {json.dumps(error_data)}\n\n"
            await redis_client.publish(channel, sse_formatted)
            print(f"Published error to Redis channel {channel}")

        return {"status": "received"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook processing failed: {str(e)}")


@router.post("/chat-name-creation")
async def handle_chat_name_creation(
        request: Request,
        chat_service: ChatService = Depends(get_chat_service),
) -> Dict[str, str]:
    try:
        payload = await request.json()
        validated_payload = WebhookPayload(**payload)

        run_id = validated_payload.run_id
        thread_id = validated_payload.thread_id
        status = validated_payload.status
        metadata = payload.get("metadata", {})

        if status == "success":
            chat_id = metadata.get("chat_id")
            title = validated_payload.values.get("title", "Chat")
            chat = await chat_service.get_chat_by_id(chat_id)
            chat.title = title
            await chat_service.update_chat(chat)

        elif status == "error":
            error_data = {
                "event": "error",
                "data": {
                    "thread_id": thread_id,
                    "error": validated_payload.values.get("error", "Unknown error")
                }
            }

        return {"status": "received"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook processing failed: {str(e)}")