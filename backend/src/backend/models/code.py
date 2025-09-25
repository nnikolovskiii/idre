from typing import Optional, Dict, Any
from enum import Enum

from pydantic import BaseModel


class Code(BaseModel):
    user_id: str
    url: str
    code: int
    description: str