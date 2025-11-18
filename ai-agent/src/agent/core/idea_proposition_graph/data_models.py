from typing import Optional, TypedDict, List, Dict, Any
from pydantic import BaseModel, Field

class IdeaProposition(BaseModel):
    what: str = Field(..., description="Description of the idea")
    why: str = Field(..., description="Explanation of importance")

class IdeaPropositionGraphState(TypedDict):
    messages: Optional[List[Dict[str, Any]]]
    api_key: Optional[str]
    light_model: Optional[str]
    idea_proposition: Optional[IdeaProposition]