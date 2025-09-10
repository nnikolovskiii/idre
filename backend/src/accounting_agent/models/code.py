from typing import Optional, Dict, Any
from enum import Enum

from accounting_agent.databases.mongo_db import MongoEntry


class Code(MongoEntry):
    user_id: str
    url: str
    code: int
    description: str