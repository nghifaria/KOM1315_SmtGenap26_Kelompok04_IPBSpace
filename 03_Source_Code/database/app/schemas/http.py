from typing import Any
from pydantic import BaseModel

class HTTPResponse(BaseModel):
    """Standardized API response model with success status and payload."""
    success: bool
    data: Any = None