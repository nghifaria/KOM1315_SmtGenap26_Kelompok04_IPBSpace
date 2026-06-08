from fastapi import APIRouter, Depends
from typing import List
from app.api.dependencies import get_audit_repository
from app.repositories.audit_repository import AuditRepository

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("/")
async def get_audit_logs(
    audit_repo: AuditRepository = Depends(get_audit_repository),
):
    logs = await audit_repo.get_login_logs(limit=100)

    formatted_logs = []
    for log in logs:
        formatted_logs.append(
            {
                "id": log.id,
                "created_at": log.created_at.isoformat(),
                "email": log.email,
                "status": log.status,  # "SUCCESS" atau "FAILED"
                "reason": log.reason,  # "Invalid credentials", dll
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
            }
        )

    return {"success": True, "data": formatted_logs}
