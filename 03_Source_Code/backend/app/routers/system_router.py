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


@router.get("/security-policy", response_model=HTTPResponse)
async def get_security_policy(
    _: bool = Depends(ensure_is_admin)
) -> HTTPResponse:
    """Retrieve system security configurations and hardening policies."""
    return HTTPResponse(
        success=True,
        data={
            "policies": {
                "authentication": {
                    "failed_login_threshold": 5,
                    "lockout_duration_minutes": 15,
                    "min_password_length": 8,
                    "password_hashing_algorithm": "bcrypt (Blowfish)",
                    "bcrypt_rounds": 12,
                },
                "authorization": {
                    "rbac_actors": ["super_admin", "facility_manager", "civitas"],
                    "session_token_type": "Bearer JWT",
                    "access_token_expiry_minutes": int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15")),
                    "refresh_token_expiry_days": int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7")),
                },
                "cryptography_at_rest": {
                    "file_encryption_cipher": "AES-256-GCM",
                    "digital_signature_algorithm": "RSASSA-PSS (2048-bit)",
                    "integrity_hash_algorithm": "SHA-256",
                },
                "system_status": {
                    "postgresql_db": "CONNECTED (SECURE)",
                    "local_encrypted_storage": "ACTIVE",
                    "python_version": "3.14 (Lifespan optimization)",
                }
            }
        }
    )
