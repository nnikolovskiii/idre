from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from accounting_agent.models import User
from accounting_agent.models.code import Code
from accounting_agent.api.routes.auth import get_current_user
from accounting_agent.container import container

router = APIRouter()


class CodeCreate(BaseModel):
    url: str
    code: int
    description: str


class CodeUpdate(BaseModel):
    url: Optional[str] = None
    code: Optional[int] = None
    description: Optional[str] = None


@router.post("/codes")
async def create_code(
        code_data: CodeCreate,
        current_user: User = Depends(get_current_user)
):
    """
    Create a new code entry for the current user.
    """
    try:
        # Create code record
        code_record = Code(
            user_id=current_user.email,
            url=code_data.url,
            code=code_data.code,
            description=code_data.description
        )

        # Save to database
        mdb = container.mdb()
        id = await mdb.add_entry(code_record)
        code_record.id = id

        return {
            "status": "success",
            "message": "Code created successfully",
            "data": {
                "id": str(code_record.id),
                "url": code_record.url,
                "code": code_record.code,
                "description": code_record.description
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating code: {str(e)}")


@router.get("/codes")
async def get_codes(
        current_user: User = Depends(get_current_user),
        code: Optional[int] = None,
        url: Optional[str] = None
):
    """
    Get all codes for the current user.
    Optionally filter by code number or URL.
    """
    try:
        mdb = container.mdb()

        # Build the filter
        doc_filter = {"user_id": current_user.email}
        if code is not None:
            doc_filter["code"] = code
        if url:
            doc_filter["url"] = url

        codes = await mdb.get_entries(
            class_type=Code,
            doc_filter=doc_filter
        )

        # Format the response
        code_data = []
        for code_record in codes:
            code_info = {
                "id": str(code_record.id),
                "url": code_record.url,
                "code": code_record.code,
                "description": code_record.description
            }
            code_data.append(code_info)

        return {
            "status": "success",
            "message": "Codes retrieved successfully",
            "data": code_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving codes: {str(e)}")


@router.get("/codes/{code_id}")
async def get_code(
        code_id: str,
        current_user: User = Depends(get_current_user)
):
    """
    Get a specific code by ID.
    """
    try:
        mdb = container.mdb()
        code_records = await mdb.get_entries(
            class_type=Code,
            doc_filter={"user_id": current_user.email, "_id": code_id}
        )

        if not code_records:
            raise HTTPException(status_code=404, detail="Code not found or you don't have permission to access it")

        code_record = code_records[0]

        return {
            "status": "success",
            "message": "Code retrieved successfully",
            "data": {
                "id": str(code_record.id),
                "url": code_record.url,
                "code": code_record.code,
                "description": code_record.description
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving code: {str(e)}")


@router.put("/codes/{code_id}")
async def update_code(
        code_id: str,
        code_update: CodeUpdate,
        current_user: User = Depends(get_current_user)
):
    """
    Update a specific code by ID.
    """
    try:
        mdb = container.mdb()

        # Check if the code exists and belongs to the user
        code_records = await mdb.get_entries(
            class_type=Code,
            doc_filter={"user_id": current_user.email, "_id": code_id}
        )

        if not code_records:
            raise HTTPException(status_code=404, detail="Code not found or you don't have permission to access it")

        # Build update data (only include fields that are not None)
        update_data = {}
        if code_update.url is not None:
            update_data["url"] = code_update.url
        if code_update.code is not None:
            update_data["code"] = code_update.code
        if code_update.description is not None:
            update_data["description"] = code_update.description

        if not update_data:
            raise HTTPException(status_code=400, detail="No valid fields provided for update")

        # Update the code
        await mdb.update_entry(
            class_type=Code,
            doc_filter={"user_id": current_user.email, "_id": code_id},
            update_data=update_data
        )

        # Get the updated code
        updated_codes = await mdb.get_entries(
            class_type=Code,
            doc_filter={"user_id": current_user.email, "_id": code_id}
        )
        updated_code = updated_codes[0]

        return {
            "status": "success",
            "message": "Code updated successfully",
            "data": {
                "id": str(updated_code.id),
                "url": updated_code.url,
                "code": updated_code.code,
                "description": updated_code.description
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating code: {str(e)}")


@router.delete("/codes/{code_id}")
async def delete_code(
        code_id: str,
        current_user: User = Depends(get_current_user)
):
    """
    Delete a specific code by ID.
    """
    try:
        mdb = container.mdb()

        # Check if the code exists and belongs to the user
        code_records = await mdb.get_entries(
            class_type=Code,
            doc_filter={"user_id": current_user.email, "_id": code_id}
        )

        if not code_records:
            raise HTTPException(status_code=404, detail="Code not found or you don't have permission to access it")

        # Delete the code
        await mdb.delete_entry(
            class_type=Code,
            doc_filter={"user_id": current_user.email, "_id": code_id}
        )

        return {
            "status": "success",
            "message": "Code deleted successfully",
            "data": {"id": code_id}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting code: {str(e)}")


@router.get("/codes/search")
async def search_codes(
        current_user: User = Depends(get_current_user),
        description_contains: Optional[str] = None,
        min_code: Optional[int] = None,
        max_code: Optional[int] = None
):
    """
    Search codes with various filters.
    """
    try:
        mdb = container.mdb()

        # Build the filter
        doc_filter = {"user_id": current_user.email}

        if description_contains:
            doc_filter["description"] = {"$regex": description_contains, "$options": "i"}

        if min_code is not None or max_code is not None:
            code_filter = {}
            if min_code is not None:
                code_filter["$gte"] = min_code
            if max_code is not None:
                code_filter["$lte"] = max_code
            doc_filter["code"] = code_filter

        codes = await mdb.get_entries(
            class_type=Code,
            doc_filter=doc_filter
        )

        # Format the response
        code_data = []
        for code_record in codes:
            code_info = {
                "id": str(code_record.id),
                "url": code_record.url,
                "code": code_record.code,
                "description": code_record.description
            }
            code_data.append(code_info)

        return {
            "status": "success",
            "message": f"Found {len(code_data)} codes matching search criteria",
            "data": code_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching codes: {str(e)}")
