from typing import AsyncGenerator
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import uuid

from backend.api.dependencies import get_proposition_service
from backend.models.dtos.proposition_dtos import PropositionResponse, PropositionUpdateRequest
from backend.services.proposition_service import PropositionService
from backend.container import container

router = APIRouter()


@router.get("/{notebook_id}", response_model=PropositionResponse)
async def get_proposition_for_notebook(
    notebook_id: uuid.UUID,
    proposition_service: PropositionService = Depends(get_proposition_service),
):
    """
    Get the proposition for a specific notebook by its ID.
    """
    try:
        proposition = await proposition_service.get_proposition_by_notebook_id(notebook_id=notebook_id)
        if not proposition:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposition not found for this notebook")

        return proposition
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {str(e)}")


@router.put("/{notebook_id}", response_model=PropositionResponse)
async def create_or_update_proposition_for_notebook(
    notebook_id: uuid.UUID,
    proposition_data: PropositionUpdateRequest,
    proposition_service: PropositionService = Depends(get_proposition_service),
):
    """
    Create or update the proposition for a given notebook. (Upsert)
    """
    try:
        proposition = await proposition_service.create_or_update_proposition(
            notebook_id=notebook_id,
            data=proposition_data.model_dump()
        )
        return proposition
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/sse/{notebook_id}")
async def sse_endpoint(notebook_id: str):
    """
    Server-Sent Events endpoint for real-time proposition updates.
    Subscribes to Redis pub/sub channel for the specific notebook.
    """
    redis_client = container.redis_client()
    channel = f"sse:proposition:{notebook_id}"
    
    async def event_generator() -> AsyncGenerator[str, None]:
        pubsub = redis_client.pubsub()
        await pubsub.subscribe(channel)
        
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    yield message["data"]
        except asyncio.CancelledError:
            pass
        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.close()
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
