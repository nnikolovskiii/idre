from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import Optional, List
import json
import asyncio

from backend.api.dependencies import get_task_service
from backend.models import User
from backend.api.routes.auth_route import get_current_user
from backend.models.dtos.task_dtos import (
    TaskCreateRequest,
    TaskUpdateRequest,
    TaskMoveRequest,
    TaskReorderRequest,
    TaskSearchRequest,
    TaskResponse,
    TasksListResponse,
    TaskOperationResponse
)
from backend.services.task_service import TaskService

router = APIRouter()


@router.get("/{notebook_id}")
async def get_tasks(
    notebook_id: str,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service),
    status: Optional[str] = Query(None, description="Filter by task status"),
    priority: Optional[str] = Query(None, description="Filter by task priority"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip")
):
    """
    Get all tasks for a user in a specific notebook with optional filtering.
    """
    try:
        # Parse filters
        from backend.models.task import TaskStatus, TaskPriority

        status_filter = None
        if status:
            try:
                status_filter = TaskStatus(status)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid status '{status}'. Must be one of: {list(TaskStatus)}"
                )

        priority_filter = None
        if priority:
            try:
                priority_filter = TaskPriority(priority)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid priority '{priority}'. Must be one of: {list(TaskPriority)}"
                )

        tags_filter = None
        if tags:
            tags_filter = [tag.strip() for tag in tags.split(',') if tag.strip()]

        tasks = await task_service.get_tasks_for_user(
            user_id=str(current_user.user_id),
            notebook_id=notebook_id,
            status=status_filter,
            priority=priority_filter,
            tags=tags_filter,
            limit=limit,
            offset=offset
        )

        task_responses = [task_service.task_to_response(task) for task in tasks]

        return TasksListResponse(
            tasks=task_responses,
            total_count=len(task_responses),
            message=f"Retrieved {len(task_responses)} tasks"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.post("/{notebook_id}")
async def create_task(
    notebook_id: str,
    task_data: TaskCreateRequest,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """
    Create a new task in a notebook.
    """
    try:
        task = await task_service.create_task(
            user_id=str(current_user.user_id),
            notebook_id=notebook_id,
            task_data=task_data
        )

        task_response = task_service.task_to_response(task)

        return TaskOperationResponse(
            status="success",
            message="Task created successfully",
            task=task_response
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/task/{task_id}")
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """
    Get a single task by ID.
    """
    try:
        task = await task_service.get_task_by_id(
            user_id=str(current_user.user_id),
            task_id=task_id
        )

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found or access denied"
            )

        task_response = task_service.task_to_response(task)

        return {
            "status": "success",
            "message": "Task retrieved successfully",
            "data": task_response.dict()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.put("/task/{task_id}")
async def update_task(
    task_id: str,
    task_data: TaskUpdateRequest,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """
    Update an existing task.
    """
    try:
        updated_task = await task_service.update_task(
            user_id=str(current_user.user_id),
            task_id=task_id,
            task_data=task_data
        )

        if not updated_task:
            raise HTTPException(
                status_code=404,
                detail="Task not found or access denied"
            )

        task_response = task_service.task_to_response(updated_task)

        return TaskOperationResponse(
            status="success",
            message="Task updated successfully",
            task=task_response
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.put("/task/{task_id}/move")
async def move_task(
    task_id: str,
    move_data: TaskMoveRequest,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """
    Move a task to a different column/status.
    """
    try:
        moved_task = await task_service.move_task(
            user_id=str(current_user.user_id),
            task_id=task_id,
            move_data=move_data
        )

        if not moved_task:
            raise HTTPException(
                status_code=404,
                detail="Task not found or access denied"
            )

        task_response = task_service.task_to_response(moved_task)

        return TaskOperationResponse(
            status="success",
            message="Task moved successfully",
            task=task_response
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.put("/task/{task_id}/reorder")
async def reorder_task(
    task_id: str,
    reorder_data: TaskReorderRequest,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """
    Reorder a task within its current column.
    """
    try:
        reordered_task = await task_service.reorder_task(
            user_id=str(current_user.user_id),
            task_id=task_id,
            reorder_data=reorder_data
        )

        if not reordered_task:
            raise HTTPException(
                status_code=404,
                detail="Task not found or access denied"
            )

        task_response = task_service.task_to_response(reordered_task)

        return TaskOperationResponse(
            status="success",
            message="Task reordered successfully",
            task=task_response
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.delete("/task/{task_id}")
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """
    Delete a task.
    """
    try:
        success = await task_service.delete_task(
            user_id=str(current_user.user_id),
            task_id=task_id
        )

        if not success:
            raise HTTPException(
                status_code=404,
                detail="Task not found or access denied"
            )

        return {
            "status": "success",
            "message": "Task deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.post("/{notebook_id}/search")
async def search_tasks(
    notebook_id: str,
    search_data: TaskSearchRequest,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """
    Search tasks with advanced filtering.
    """
    try:
        tasks = await task_service.search_tasks(
            user_id=str(current_user.user_id),
            search_data=search_data,
            notebook_id=notebook_id
        )

        task_responses = [task_service.task_to_response(task) for task in tasks]

        return TasksListResponse(
            tasks=task_responses,
            total_count=len(task_responses),
            message=f"Found {len(task_responses)} tasks matching search criteria"
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/{notebook_id}/statistics")
async def get_task_statistics(
    notebook_id: str,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """
    Get task statistics for a notebook.
    """
    try:
        stats = await task_service.get_task_statistics(
            user_id=str(current_user.user_id),
            notebook_id=notebook_id
        )

        return {
            "status": "success",
            "message": "Task statistics retrieved successfully",
            "data": stats
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/{notebook_id}/sse")
async def tasks_sse(
    notebook_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Server-Sent Events endpoint for real-time task updates.
    """
    try:
        # Import here to avoid circular imports
        from backend.container import container

        redis_client = container.redis_client()
        channel = f"sse:tasks:{notebook_id}"

        # Check if user has access to this notebook
        # This is a simplified check - you might want to add proper notebook access validation
        user_channel = f"sse:user:{str(current_user.user_id)}"

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