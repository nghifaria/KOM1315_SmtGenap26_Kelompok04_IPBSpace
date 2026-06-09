from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.user_service import UserService
from app.repositories import user_repository, audit_repository
from app.schemas.user import UserResponse, UserUpdate, ManagerCreate, ManagerUpdate, ManagerResponse
from app.api.dependencies import ensure_is_admin, get_current_user, ensure_is_admin_or_facility_manager
from app.schemas.http import HTTPResponse

router = APIRouter(prefix="/users", tags=["users"])

async def get_user_service(db: AsyncSession = Depends(get_db)):
    repo = user_repository.UserRepository(db)
    return UserService(repo)

@router.get("/me", response_model=HTTPResponse)
async def read_current_user(
    current_user: UserResponse = Depends(get_current_user)
) -> HTTPResponse:
    """
    Endpoint to retrieve the current authenticated user's information.
    """
    return HTTPResponse(success=True, data={"user": current_user})

@router.get("/me/security-audit", response_model=HTTPResponse)
async def read_current_user_security_audit(
    current_user: UserResponse = Depends(get_current_user),
    service: UserService = Depends(get_user_service)
) -> HTTPResponse:
    """
    Endpoint to retrieve the current user's password hashing salt and metadata for security auditing.
    """
    db_user = await service.user_repository.get_by_id(current_user.id)
    if not db_user or not db_user.hashed_password:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User password hash not found")
        
    hashed = db_user.hashed_password
    try:
        parts = hashed.split("$")
        if len(parts) >= 4:
            algorithm = f"bcrypt ({parts[1]})"
            rounds = int(parts[2])
            salt_and_hash = parts[3]
            salt_b64 = salt_and_hash[:22]
            return HTTPResponse(
                success=True,
                data={
                    "algorithm": algorithm,
                    "rounds": rounds,
                    "salt_b64": salt_b64,
                    "entropy_info": "128-bit CSPRNG Salt"
                }
            )
    except Exception:
        pass
        
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to parse password security metadata"
    )

@router.put("/me", response_model=HTTPResponse)
async def update_current_user(
    data: UserUpdate,
    current_user: UserResponse = Depends(get_current_user),
    service: UserService = Depends(get_user_service)
) -> HTTPResponse:
    """
    Endpoint to update the current authenticated user's profile information.
    """
    updated_user = await service.update_user(
        user_id=current_user.id,
        fullname=data.fullname.strip(),
        idnum=data.idnum.strip(),
        email=data.email.strip()
    )
    return HTTPResponse(success=True, data={"user": updated_user})

@router.get("/", response_model=HTTPResponse)
async def read_all_users(
    skip: int = Query(0, ge=0, description="The number of records to skip for pagination"),
    limit: int = Query(10000, gt=0, le=50000, description="The maximum number of records to return"),
    service: UserService = Depends(get_user_service),
    _: bool = Depends(ensure_is_admin_or_facility_manager),
) -> HTTPResponse:
    """
    Endpoint to retrieve a list of users with pagination. Requires authentication.
    
    :param skip: The number of records to skip for pagination
    :type skip: int
    :param limit: The maximum number of records to return
    :type limit: int
    :param service: The UserService dependency for handling user-related business logic
    :type service: UserService
    :param current_user: The current authenticated user retrieved from the get_current_user dependency (used for authorization)
    :type current_user: UserResponse
    :param _: The current authenticated user retrieved from the ensure_is_admin dependency (used for authorization)
    :type _: UserResponse
    :return: A list of UserResponse objects representing the users in the system
    :rtype: List[UserResponse]
    """
    users = await service.get_users(skip=skip, limit=limit)
    return HTTPResponse(success=True, data={"items": users})

@router.get("/managers", response_model=HTTPResponse)
async def read_all_managers(
    skip: int = Query(0, ge=0, description="The number of records to skip for pagination"),
    limit: int = Query(100, gt=0, le=1000, description="The maximum number of records to return"),
    service: UserService = Depends(get_user_service),
    _: bool = Depends(ensure_is_admin),
) -> HTTPResponse:
    """
    Retrieve all facility managers with pagination. Requires admin privileges.
    """
    managers = await service.list_managers(skip=skip, limit=limit)
    return HTTPResponse(success=True, data={"items": managers})

@router.get("/managers/{manager_id}", response_model=HTTPResponse)
async def read_manager_by_id(
    manager_id: int,
    service: UserService = Depends(get_user_service),
    _: bool = Depends(ensure_is_admin),
) -> HTTPResponse:
    """
    Retrieve a facility manager's details by ID. Requires admin privileges.
    """
    manager = await service.get_manager_by_id(manager_id)
    return HTTPResponse(success=True, data={"manager": manager})

@router.post("/managers", response_model=HTTPResponse, status_code=status.HTTP_201_CREATED)
async def create_manager(
    data: ManagerCreate,
    service: UserService = Depends(get_user_service),
    _: bool = Depends(ensure_is_admin),
) -> HTTPResponse:
    """
    Create a new facility manager. Requires admin privileges.
    """
    new_manager = await service.create_manager(data)
    return HTTPResponse(success=True, data={"manager": new_manager})

@router.put("/managers/{manager_id}", response_model=HTTPResponse)
async def update_manager(
    manager_id: int,
    data: ManagerUpdate,
    service: UserService = Depends(get_user_service),
    _: bool = Depends(ensure_is_admin),
) -> HTTPResponse:
    """
    Update a facility manager's information by ID. Requires admin privileges.
    """
    updated_manager = await service.update_manager(manager_id, data)
    return HTTPResponse(success=True, data={"manager": updated_manager})

@router.delete("/managers/{manager_id}", response_model=HTTPResponse)
async def delete_manager(
    manager_id: int,
    service: UserService = Depends(get_user_service),
    _: bool = Depends(ensure_is_admin),
) -> HTTPResponse:
    """
    Delete a facility manager by ID. Requires admin privileges.
    """
    await service.delete_manager(manager_id)
    return HTTPResponse(success=True, data={"message": "Manager deleted successfully"})

@router.get("/{user_id}", response_model=HTTPResponse)
async def read_user_by_id(
    user_id: int,
    service: UserService = Depends(get_user_service),
    _: bool = Depends(ensure_is_admin_or_facility_manager)
) -> HTTPResponse:
    """
    Endpoint to retrieve a user's information by their ID. Requires admin or facility manager privileges.

    :param user_id: The ID of the user to retrieve
    :type user_id: int
    :param service: The UserService dependency for handling user-related business logic
    :type service: UserService
    :param _: The current authenticated user retrieved from the ensure_is_admin_or_facility_manager dependency (used for authorization)
    :type _: UserResponse
    :return: The UserResponse object representing the requested user if found, otherwise raises an HTTPException
    :rtype: UserResponse
    """
    user = await service.get_user_by_id(user_id)
    return HTTPResponse(success=True, data={"user": user})


@router.get("/admin/login-logs", response_model=HTTPResponse)
async def read_login_logs(
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(ensure_is_admin),
) -> HTTPResponse:
    """
    Retrieve all login logs. Requires admin privileges.
    """
    repo = audit_repository.AuditRepository(db)
    logs = await repo.get_login_logs()

    formatted_logs = []
    for log in logs:
        formatted_logs.append({
            "id": log.id,
            "email": log.email,
            "user_id": log.user_id,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "status": log.status,
            "reason": log.reason,
            "created_at": log.created_at.isoformat() if log.created_at else None
        })
    return HTTPResponse(success=True, data={"items": formatted_logs})
    

@router.post("/{user_id}/unlock", response_model=HTTPResponse)
async def unlock_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    _: bool = Depends(ensure_is_admin),
) -> HTTPResponse:
    """
    Unlock a user account by resetting failed login attempts and lockout timestamps.
    Requires admin privileges.
    """
    await service.user_repository.reset_failed_login(user_id)
    return HTTPResponse(success=True, data={"message": "Akun berhasil dibuka kembali"})