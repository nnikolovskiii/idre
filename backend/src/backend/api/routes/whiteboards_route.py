from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import Optional
import json
import asyncio

from backend.api.dependencies import get_whiteboard_service
from backend.models import User
from backend.api.routes.auth_route import get_current_user
from backend.models.dtos.whiteboard_dtos import (
    WhiteboardCreateRequest,
    WhiteboardUpdateRequest,
    WhiteboardSearchRequest,
    WhiteboardResponse,
    WhiteboardsListResponse,
    WhiteboardOperationResponse,
    NodeHierarchyUpdate,
    CreateChildNodeRequest,
    NodeHierarchyResponse,
    ValidateHierarchyRequest,
    HierarchyValidationResponse
)
from backend.services.whiteboard_service import WhiteboardService

router = APIRouter()


@router.get("/{notebook_id}")
async def get_whiteboards(
    notebook_id: str,
    current_user: User = Depends(get_current_user),
    whiteboard_service: WhiteboardService = Depends(get_whiteboard_service),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip")
):
    """
    Get all whiteboards for a user in a specific notebook.
    """
    try:
        whiteboards = await whiteboard_service.get_whiteboards_for_user(
            user_id=str(current_user.user_id),
            notebook_id=notebook_id,
            limit=limit,
            offset=offset
        )

        whiteboard_responses = [whiteboard_service.whiteboard_to_response(whiteboard) for whiteboard in whiteboards]

        return WhiteboardsListResponse(
            whiteboards=whiteboard_responses,
            total_count=len(whiteboard_responses),
            message=f"Retrieved {len(whiteboard_responses)} whiteboards"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.post("/{notebook_id}")
async def create_whiteboard(
    notebook_id: str,
    whiteboard_data: WhiteboardCreateRequest,
    current_user: User = Depends(get_current_user),
    whiteboard_service: WhiteboardService = Depends(get_whiteboard_service)
):
    """
    Create a new whiteboard in a notebook.
    """
    try:
        whiteboard = await whiteboard_service.create_whiteboard(
            user_id=str(current_user.user_id),
            notebook_id=notebook_id,
            whiteboard_data=whiteboard_data
        )

        whiteboard_response = whiteboard_service.whiteboard_to_response(whiteboard)

        return WhiteboardOperationResponse(
            status="success",
            message="Whiteboard created successfully",
            whiteboard=whiteboard_response
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/whiteboard/{whiteboard_id}")
async def get_whiteboard(
    whiteboard_id: str,
    current_user: User = Depends(get_current_user),
    whiteboard_service: WhiteboardService = Depends(get_whiteboard_service)
):
    """
    Get a single whiteboard by ID.
    """
    try:
        whiteboard = await whiteboard_service.get_whiteboard_by_id(
            user_id=str(current_user.user_id),
            whiteboard_id=whiteboard_id
        )

        if not whiteboard:
            raise HTTPException(
                status_code=404,
                detail="Whiteboard not found or access denied"
            )

        whiteboard_response = whiteboard_service.whiteboard_to_response(whiteboard)

        return {
            "status": "success",
            "message": "Whiteboard retrieved successfully",
            "data": whiteboard_response.dict()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.put("/whiteboard/{whiteboard_id}")
async def update_whiteboard(
    whiteboard_id: str,
    whiteboard_data: WhiteboardUpdateRequest,
    current_user: User = Depends(get_current_user),
    whiteboard_service: WhiteboardService = Depends(get_whiteboard_service)
):
    """
    Update an existing whiteboard.
    """
    try:
        updated_whiteboard = await whiteboard_service.update_whiteboard(
            user_id=str(current_user.user_id),
            whiteboard_id=whiteboard_id,
            whiteboard_data=whiteboard_data
        )

        if not updated_whiteboard:
            raise HTTPException(
                status_code=404,
                detail="Whiteboard not found or access denied"
            )

        whiteboard_response = whiteboard_service.whiteboard_to_response(updated_whiteboard)

        # Send SSE notification
        await _send_whiteboard_sse_notification(updated_whiteboard, "updated", whiteboard_service)

        return WhiteboardOperationResponse(
            status="success",
            message="Whiteboard updated successfully",
            whiteboard=whiteboard_response
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.put("/whiteboard/{whiteboard_id}/content")
async def update_whiteboard_content(
    whiteboard_id: str,
    content: dict,
    current_user: User = Depends(get_current_user),
    whiteboard_service: WhiteboardService = Depends(get_whiteboard_service)
):
    """
    Update just the content of a whiteboard (for auto-save functionality).
    """
    try:
        updated_whiteboard = await whiteboard_service.update_whiteboard_content(
            user_id=str(current_user.user_id),
            whiteboard_id=whiteboard_id,
            content=content
        )

        if not updated_whiteboard:
            raise HTTPException(
                status_code=404,
                detail="Whiteboard not found or access denied"
            )

        whiteboard_response = whiteboard_service.whiteboard_to_response(updated_whiteboard)

        # Send SSE notification for real-time updates
        await _send_whiteboard_sse_notification(updated_whiteboard, "content_updated", whiteboard_service)

        return {
            "status": "success",
            "message": "Whiteboard content updated successfully",
            "data": whiteboard_response.dict()
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.delete("/whiteboard/{whiteboard_id}")
async def delete_whiteboard(
    whiteboard_id: str,
    current_user: User = Depends(get_current_user),
    whiteboard_service: WhiteboardService = Depends(get_whiteboard_service)
):
    """
    Delete a whiteboard.
    """
    try:
        # Get the whiteboard first to send SSE notification
        whiteboard = await whiteboard_service.get_whiteboard_by_id(
            user_id=str(current_user.user_id),
            whiteboard_id=whiteboard_id
        )

        success = await whiteboard_service.delete_whiteboard(
            user_id=str(current_user.user_id),
            whiteboard_id=whiteboard_id
        )

        if not success:
            raise HTTPException(
                status_code=404,
                detail="Whiteboard not found or access denied"
            )

        # Send SSE notification
        if whiteboard:
            await _send_whiteboard_sse_notification(whiteboard, "deleted", whiteboard_service)

        return {
            "status": "success",
            "message": "Whiteboard deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.post("/{notebook_id}/search")
async def search_whiteboards(
    notebook_id: str,
    search_data: WhiteboardSearchRequest,
    current_user: User = Depends(get_current_user),
    whiteboard_service: WhiteboardService = Depends(get_whiteboard_service)
):
    """
    Search whiteboards with advanced filtering.
    """
    try:
        whiteboards = await whiteboard_service.search_whiteboards(
            user_id=str(current_user.user_id),
            search_data=search_data,
            notebook_id=notebook_id
        )

        whiteboard_responses = [whiteboard_service.whiteboard_to_response(whiteboard) for whiteboard in whiteboards]

        return WhiteboardsListResponse(
            whiteboards=whiteboard_responses,
            total_count=len(whiteboard_responses),
            message=f"Found {len(whiteboard_responses)} whiteboards matching search criteria"
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/{notebook_id}/statistics")
async def get_whiteboard_statistics(
    notebook_id: str,
    current_user: User = Depends(get_current_user),
    whiteboard_service: WhiteboardService = Depends(get_whiteboard_service)
):
    """
    Get whiteboard statistics for a notebook.
    """
    try:
        stats = await whiteboard_service.get_whiteboard_statistics(
            user_id=str(current_user.user_id),
            notebook_id=notebook_id
        )

        return {
            "status": "success",
            "message": "Whiteboard statistics retrieved successfully",
            "data": stats
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/{notebook_id}/sse")
async def whiteboards_sse(
    notebook_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Server-Sent Events endpoint for real-time whiteboard updates.
    """
    try:
        # Import here to avoid circular imports
        from backend.container import container

        redis_client = container.redis_client()
        channel = f"sse:whiteboards:{notebook_id}"

        async def event_generator():
            pubsub = redis_client.pubsub()
            await pubsub.subscribe(channel)

            try:
                # Send initial connection message
                yield f"data: {json.dumps({'type': 'connected', 'notebook_id': notebook_id})}\n\n"

                async for message in pubsub.listen():
                    if message["type"] == "message":
                        # Parse the message to ensure it's valid JSON
                        try:
                            data = json.loads(message["data"])
                            # Add timestamp
                            data["timestamp"] = asyncio.get_event_loop().time()
                            yield f"data: {json.dumps(data)}\n\n"
                        except (json.JSONDecodeError, KeyError):
                            # Skip invalid messages
                            continue

            except Exception as e:
                # Send error message to client
                error_data = {
                    "type": "error",
                    "message": str(e),
                    "timestamp": asyncio.get_event_loop().time()
                }
                yield f"data: {json.dumps(error_data)}\n\n"
            finally:
                await pubsub.unsubscribe(channel)

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable buffering in nginx
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SSE error: {str(e)}")


# Hierarchy Management Endpoints

@router.post("/whiteboard/{whiteboard_id}/nodes/hierarchy")
async def update_node_hierarchy(
    whiteboard_id: str,
    hierarchy_update: NodeHierarchyUpdate,
    current_user: User = Depends(get_current_user),
    whiteboard_service: WhiteboardService = Depends(get_whiteboard_service)
):
    """
    Update parent-child relationships between nodes.
    """
    try:
        # Get whiteboard to verify ownership
        whiteboard = await whiteboard_service.get_whiteboard_by_id(
            user_id=str(current_user.user_id),
            whiteboard_id=whiteboard_id
        )

        if not whiteboard:
            raise HTTPException(
                status_code=404,
                detail="Whiteboard not found or access denied"
            )

        # Update hierarchy
        result = whiteboard_service.update_node_hierarchy(
            whiteboard.content or {},
            hierarchy_update
        )

        if result.status == "error":
            raise HTTPException(
                status_code=400,
                detail=result.message
            )

        # Save updated content
        await whiteboard_service.update_whiteboard_content(
            user_id=str(current_user.user_id),
            whiteboard_id=whiteboard_id,
            content=result.updated_content
        )

        # Send SSE notification
        await _send_whiteboard_sse_notification(whiteboard, "hierarchy_updated", whiteboard_service)

        return result.dict()

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.post("/whiteboard/{whiteboard_id}/nodes/children")
async def create_child_node(
    whiteboard_id: str,
    request: CreateChildNodeRequest,
    current_user: User = Depends(get_current_user),
    whiteboard_service: WhiteboardService = Depends(get_whiteboard_service)
):
    """
    Create a new node as a child of an existing node.
    """
    try:
        # Get whiteboard to verify ownership
        whiteboard = await whiteboard_service.get_whiteboard_by_id(
            user_id=str(current_user.user_id),
            whiteboard_id=whiteboard_id
        )

        if not whiteboard:
            raise HTTPException(
                status_code=404,
                detail="Whiteboard not found or access denied"
            )

        # Create child node
        result = whiteboard_service.create_child_node(
            whiteboard.content or {},
            request
        )

        if result.status == "error":
            raise HTTPException(
                status_code=400,
                detail=result.message
            )

        # Save updated content
        await whiteboard_service.update_whiteboard_content(
            user_id=str(current_user.user_id),
            whiteboard_id=whiteboard_id,
            content=result.updated_content
        )

        # Send SSE notification
        await _send_whiteboard_sse_notification(whiteboard, "node_created", whiteboard_service)

        return result.dict()

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.post("/whiteboard/{whiteboard_id}/nodes/hierarchy/validate")
async def validate_hierarchy(
    whiteboard_id: str,
    validation_request: ValidateHierarchyRequest,
    current_user: User = Depends(get_current_user),
    whiteboard_service: WhiteboardService = Depends(get_whiteboard_service)
):
    """
    Validate hierarchy changes to prevent circular references.
    """
    try:
        # Get whiteboard to verify ownership
        whiteboard = await whiteboard_service.get_whiteboard_by_id(
            user_id=str(current_user.user_id),
            whiteboard_id=whiteboard_id
        )

        if not whiteboard:
            raise HTTPException(
                status_code=404,
                detail="Whiteboard not found or access denied"
            )

        # Validate hierarchy
        result = whiteboard_service.validate_hierarchy(
            validation_request.whiteboard_content,
            validation_request.node_id,
            validation_request.proposed_parent_id
        )

        return result.dict()

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


async def _send_whiteboard_sse_notification(whiteboard, action: str, whiteboard_service: WhiteboardService):
    """
    Send SSE notification for whiteboard operations.
    """
    try:
        from backend.container import container

        redis_client = container.redis_client()
        channel = f"sse:whiteboards:{str(whiteboard.notebook_id)}"

        notification = {
            "type": "whiteboard_updated",
            "action": action,
            "whiteboard_id": str(whiteboard.id),
            "notebook_id": str(whiteboard.notebook_id),
            "data": whiteboard_service.whiteboard_to_response(whiteboard).dict()
        }

        await redis_client.publish(channel, json.dumps(notification))
    except Exception:
        # Don't fail the operation if SSE notification fails
        pass