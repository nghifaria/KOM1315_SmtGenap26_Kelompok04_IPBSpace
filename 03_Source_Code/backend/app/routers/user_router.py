from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.user_service import UserService
from app.repositories import user_repository
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