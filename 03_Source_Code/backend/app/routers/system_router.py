import os
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.http import HTTPResponse
from app.core.logging import LOG_FILE
from app.api.dependencies import ensure_is_admin

router = APIRouter(prefix="/system", tags=["system"])

@router.get("/logs", response_model=HTTPResponse)
async def get_logs(
    _: bool = Depends(ensure_is_admin)
):
    """Retrieve the contents of the local application log file."""
    if not os.path.exists(LOG_FILE):
        return HTTPResponse(success=True, data={"logs": "", "message": "Log file not found yet."})
    
    try:
        with open(LOG_FILE, "r") as f:
            logs = f.read()
        return HTTPResponse(success=True, data={"logs": logs})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading log file: {str(e)}")
