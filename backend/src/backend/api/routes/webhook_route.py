from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from langgraph_sdk import get_client
import os
from dotenv import load_dotenv
from pydantic import BaseModel
import json

from backend.api.dependencies import get_file_service, get_chat_service, get_ai_service, get_proposition_service, \
    get_whiteboard_service
from backend.models.file import ProcessingStatus
from backend.services.ai_service import AIService
from backend.services.chat_service import ChatService
from backend.services.file_service import FileService
from fastapi import FastAPI, Request, BackgroundTasks
from backend.container import container
from backend.services.proposition_service import PropositionService
from backend.services.whiteboard_service import WhiteboardService

router = APIRouter()
load_dotenv()
LANGGRAPH_URL = os.getenv("LANGGRAPH_URL")


@router.post("/transcription-hook")
async def handle_transcription_webhook(
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

            file_name = values.get("file_name")
            if not file_name:
                raise HTTPException(status_code=500, detail="No file_name in final state")

            await file_service.update_file(
                file_id=file_id,
                user_id=user_id,
                updates={
                    "processing_result": {"transcription": transcription},
                    "processing_status": ProcessingStatus.COMPLETED,
                    "content": transcription,
                    "filename": file_name,
                },
                merge_processing_result=True,
            )

            # Cleanup thread
            background_tasks.add_task(
                lambda tid=thread_id: langgraph_client.threads.delete(tid)
            )

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
            background_tasks.add_task(
                lambda tid=thread_id: langgraph_client.threads.delete(tid)
            )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Failed to fetch state for {run_id}: {e}")

    return {"received": "ok", "run_id": run_id}


class WebhookPayload(BaseModel):
    run_id: str
    thread_id: str
    status: str  # e.g., 'success', 'error'
    values: dict  # The final graph state or outputs


@router.post("/chat-response")
async def handle_chat_response_webhook(
        request: Request,
        ai_service: AIService = Depends(get_ai_service),
) -> Dict[str, str]:
    redis_client = container.redis_client()

    try:
        payload = await request.json()
        validated_payload = WebhookPayload(**payload)

        run_id = validated_payload.run_id
        thread_id = validated_payload.thread_id
        status = validated_payload.status
        metadata = payload.get("metadata", {})

        generation_context = metadata.get("generation_context")

        if status == "success":
            full_messages = validated_payload.values.get("messages", [])
            delta = full_messages[-1:] if full_messages else []
            sub_mode = metadata.get("sub_mode")
            notebook_id = metadata.get("notebook_id")
            user_id = metadata.get("user_id")

            if sub_mode and sub_mode == "idea_proposition":
                await ai_service.generate_idea_proposition(
                    notebook_id=notebook_id,
                    user_id=user_id,
                    messages=full_messages
                )
            else:
                # Regular chat message
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

                # NOTE: Chat route expects pre-formatted SSE string
                sse_formatted = f"data: {event_json}\n\n"

                await redis_client.publish(channel, sse_formatted)
                print(f"Published SSE update to Redis channel {channel}")

        elif status == "error":
            # Handle generation error
            if generation_context:
                pass
            else:
                # Regular chat error
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


@router.post("/whiteboard-generation")
async def handle_whiteboard_generation_webhook(
        request: Request,
        whiteboard_service: WhiteboardService = Depends(get_whiteboard_service),
) -> Dict[str, str]:
    redis_client = container.redis_client()

    try:
        payload = await request.json()
        validated_payload = WebhookPayload(**payload)

        run_id = validated_payload.run_id
        status = validated_payload.status
        metadata = payload.get("metadata", {})

        if status == "success":
            generation_context = metadata.get("generation_context")
            user_id = metadata.get("user_id")

            if not generation_context:
                print("Missing generation_context in whiteboard generation webhook")
                return {"status": "error", "message": "Missing generation_context"}

            full_messages = validated_payload.values.get("messages", [])

            # Handle whiteboard generation
            await handle_whiteboard_generation(
                generation_context=generation_context,
                messages=full_messages,
                user_id=user_id,
                redis_client=redis_client,
                run_id=run_id,
                whiteboard_service=whiteboard_service
            )

        elif status == "error":
            generation_context = metadata.get("generation_context")

            if generation_context:
                await handle_whiteboard_generation_error(
                    generation_context=generation_context,
                    error=validated_payload.values.get("error", "Unknown error"),
                    redis_client=redis_client,
                    run_id=run_id
                )

        return {"status": "received"}
    except Exception as e:
        print(f"Webhook processing failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Webhook processing failed: {str(e)}")


async def handle_whiteboard_generation(
        generation_context: dict,
        messages: list,
        user_id: str,
        redis_client,
        run_id: str,
        whiteboard_service: WhiteboardService,
):
    """Handle whiteboard node generation updates"""
    try:
        whiteboard_id = generation_context.get("whiteboard_id")
        node_id = generation_context.get("node_id")
        node_type = generation_context.get("node_type")

        if not whiteboard_id or not node_id or not node_type:
            print(f"Missing generation context: {generation_context}")
            return

        # --- UPDATED CONTENT EXTRACTION LOGIC ---
        generated_content = ""
        if messages and len(messages) > 0:
            last_message = messages[-1]

            # 1. Try dictionary access (standard for serialized JSON)
            if isinstance(last_message, dict):
                generated_content = last_message.get("content", "")

            # 2. Try object attribute access (standard for LangChain objects)
            elif hasattr(last_message, "content"):
                generated_content = last_message.content

            # 3. Handle string cleanup (remove quotes or markdown)
            if generated_content:
                generated_content = str(generated_content).strip()
                # Remove wrapping quotes if AI added them
                if generated_content.startswith('"') and generated_content.endswith('"'):
                    generated_content = generated_content[1:-1]

        if not generated_content:
            print(f"Warning: Extracted content is empty for run {run_id}. Messages: {messages}")
        # ----------------------------------------

        # Get current whiteboard content
        whiteboard = await whiteboard_service.get_whiteboard_by_id(user_id, whiteboard_id)
        if not whiteboard:
            print(f"Whiteboard {whiteboard_id} not found")
            return

        content = whiteboard.content or {}
        nodes = content.get("nodes", [])
        edges = content.get("edges", [])

        # Find and update the generating node
        node_updated = False
        for i, node in enumerate(nodes):
            if node.get("id") == node_id:
                # Update node with generated content and clear loading state
                node_data = node.get("data", {})

                # Map generated content based on node type
                if node_type == "ideaNode":
                    node_data["idea"] = generated_content
                elif node_type == "topicNode":
                    # For topics, split by lines or create a single topic
                    topics = [line.strip() for line in generated_content.split('\n') if line.strip()]
                    node_data["topics"] = topics[:5]  # Limit to 5 topics
                elif node_type == "noteNode":
                    node_data["text"] = generated_content

                # Clear loading state
                node_data["isGenerating"] = False
                nodes[i]["data"] = node_data
                node_updated = True
                print(f"Updated node {node_id} with content: {generated_content[:50]}...")
                break

        if node_updated:
            # Update whiteboard content in DATABASE
            updated_content = {"nodes": nodes, "edges": edges}
            await whiteboard_service.update_whiteboard_content(user_id, whiteboard_id, updated_content)

            # Publish SSE event for whiteboard update
            event_data = {
                "event": "whiteboard_generation_complete",
                "data": {
                    "whiteboard_id": whiteboard_id,
                    "node_id": node_id,
                    "node_type": node_type,
                    "generated_content": generated_content,
                    "status": "completed",
                    "run_id": run_id
                }
            }

            channel = f"sse:whiteboard:{whiteboard_id}"

            # --- CRITICAL FIX: Publish raw JSON, NOT 'data: ...' string ---
            # The whiteboards_route.py handles the 'data: ...' wrapping
            event_json = json.dumps(event_data)

            await redis_client.publish(channel, event_json)
            print(f"Published whiteboard generation update to Redis channel {channel}")
        else:
            print(f"Node {node_id} not found in whiteboard {whiteboard_id}")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error handling whiteboard generation: {str(e)}")


async def handle_whiteboard_generation_error(
        generation_context: dict,
        error: str,
        redis_client,
        run_id: str
):
    """Handle whiteboard generation errors"""
    try:
        whiteboard_id = generation_context.get("whiteboard_id")
        node_id = generation_context.get("node_id")

        if not whiteboard_id or not node_id:
            return

        # Publish error event
        event_data = {
            "event": "whiteboard_generation_error",
            "data": {
                "whiteboard_id": whiteboard_id,
                "node_id": node_id,
                "error": error,
                "status": "error",
                "run_id": run_id
            }
        }

        channel = f"sse:whiteboard:{whiteboard_id}"

        # --- CRITICAL FIX: Publish raw JSON ---
        event_json = json.dumps(event_data)

        await redis_client.publish(channel, event_json)
        print(f"Published whiteboard generation error to Redis channel {channel}")

    except Exception as e:
        print(f"Error handling whiteboard generation error: {str(e)}")


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
            if chat:
                chat.title = title
                await chat_service.update_chat(chat)

        return {"status": "received"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook processing failed: {str(e)}")


@router.post("/idea-proposition-hook")
async def handle_idea_proposition_webhook(
        request: Request,
        proposition_service: PropositionService = Depends(get_proposition_service),
) -> Dict[str, str]:
    redis_client = container.redis_client()

    try:
        payload = await request.json()
        validated_payload = WebhookPayload(**payload)

        run_id = validated_payload.run_id
        thread_id = validated_payload.thread_id
        status = validated_payload.status
        metadata = payload.get("metadata", {})

        if status == "success":
            notebook_id = metadata.get("notebook_id")
            idea_proposition = validated_payload.values.get("idea_proposition", {})

            # Update the proposition in the database
            updated_proposition = await proposition_service.create_or_update_proposition(notebook_id, idea_proposition)

            # Publish SSE event to Redis channel for this notebook
            event_data = {
                "event": "proposition_update",
                "data": {
                    "notebook_id": notebook_id,
                    "proposition": {
                        "what": updated_proposition.what,
                        "why": updated_proposition.why,
                    },
                    "status": "completed",
                    "run_id": run_id
                }
            }

            channel = f"sse:proposition:{notebook_id}"

            # --- CRITICAL FIX: Publish raw JSON ---
            event_json = json.dumps(event_data)

            await redis_client.publish(channel, event_json)
            print(f"Published SSE update to Redis channel {channel}")

        elif status == "error":
            notebook_id = metadata.get("notebook_id")
            error_data = {
                "event": "error",
                "data": {
                    "notebook_id": notebook_id,
                    "thread_id": thread_id,
                    "error": validated_payload.values.get("error", "Unknown error")
                }
            }

            if notebook_id:
                channel = f"sse:proposition:{notebook_id}"

                # --- CRITICAL FIX: Publish raw JSON ---
                event_json = json.dumps(error_data)

                await redis_client.publish(channel, event_json)
                print(f"Published error to Redis channel {channel}")

        return {"status": "received"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook processing failed: {str(e)}")


@router.post("/file-name-hook")
async def handle_file_name_webhook(
        request: Request,
        file_service: FileService = Depends(get_file_service),
) -> Dict[str, str]:
    try:
        payload = await request.json()
        validated_payload = WebhookPayload(**payload)

        run_id = validated_payload.run_id
        status = validated_payload.status
        metadata = payload.get("metadata", {})

        if status == "success":
            file_name = validated_payload.values.get("file_name", "text_input")
            file_id = metadata.get("file_id")
            user_id = metadata.get("user_id")

            await file_service.update_file(
                file_id=file_id,
                user_id=user_id,
                updates={
                    "processing_status": ProcessingStatus.COMPLETED,
                    "filename": file_name,
                },
                merge_processing_result=True,
            )

        return {"status": "received"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook processing failed: {str(e)}")