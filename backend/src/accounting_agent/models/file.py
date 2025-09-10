from typing import Optional, Dict, Any
from enum import Enum

from accounting_agent.databases.mongo_db import MongoEntry


class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class File(MongoEntry):
    user_id: str
    url: str
    filename: str  # Original filename provided by the user
    unique_filename: str  # Unique filename used for storage and URLs
    content_type: Optional[str] = None
    processing_status: ProcessingStatus = ProcessingStatus.PENDING
    thread_id: Optional[str] = None
    run_id: Optional[str] = None
    processing_result: Optional[Dict[str, Any]] = None
