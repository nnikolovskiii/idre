from typing import Dict, Any
from fastapi import APIRouter

from backend.models import File
from backend.models.code import Code
from backend.models.file import ProcessingStatus
from backend.container import container

router = APIRouter()


@router.post("/lol")
async def handle_langgraph_webhook(
        payload: Dict[str, Any],
) -> Dict[str, str]:
    """
    Receives the POST request that LangGraph sends
    when a run completes (success, error, timeout, etc.).
    """
    run_id = payload.get("run_id")
    status = payload.get("status")  # "success", "error", "timeout", "interrupted"
    values = payload.get("values")  # final state / output
    metadata = payload.get("metadata", {})

    if status == "success":
        user_id = metadata.get("user_id")
        url = metadata.get("url")
        file_id = metadata.get("file_id")


        for value in values["response"]:
            descr = value["entry"]
            code = value["code"]

            code_obj = Code(user_id=user_id,url=url, code=code, description=descr)

        # file_obj.processing_status = ProcessingStatus.COMPLETED
        # file_obj.processing_result = values
    elif status == "error":
        print("Error details:", payload.get("error"))
    else:
        pass

    return {"received": "ok"}
