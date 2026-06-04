from fastapi import HTTPException, status

from app.repositories.user_repository import UserRepository
from app.schemas.user import UserResponse, UserCreate, ManagerCreate, ManagerUpdate, ManagerResponse
from app.core.security import Security

class UserService:
    """
    Service class for handling user-related business operations.
    """

    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    async def get_current_user(self, user_id: int) -> UserResponse:
        """
        Retrieve the current user by their ID.
        
        :param user_id: The ID of the user to retrieve
        :type user_id: int
        :return: The UserResponse object if found, otherwise raises HTTPException
        :rtype: UserResponse
        """
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        return UserResponse.model_validate(user)
    
    async def get_users(self, skip: int = 0, limit: int = 100) -> list[UserResponse]:
        """
        Retrieve a list of users with pagination.
        
        :param skip: The number of records to skip for pagination
        :type skip: int
        :param limit: The maximum number of records to return
        :type limit: int
        :return: A list of UserResponse objects
        :rtype: List[UserResponse]
        """
        users = await self.user_repository.list_users(skip=skip, limit=limit)
        return [UserResponse.model_validate(user) for user in users]
    
    async def get_user_by_id(self, user_id: int) -> UserResponse:
        """
        Retrieve a user by their ID.
        
        :param user_id: The ID of the user to retrieve
        :type user_id: int
        :return: The UserResponse object if found, otherwise raises HTTPException
        :rtype: UserResponse
        """
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        return UserResponse.model_validate(user)
        
    async def update_user(self, user_id: int, fullname: str, idnum: str, email: str) -> UserResponse:
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        # Check if email is unique if changed
        if email != user.email:
            existing = await self.user_repository.get_by_email(email)
            if existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
                
        updated = await self.user_repository.update(user_id, fullname=fullname, idnum=idnum, email=email)
        return UserResponse.model_validate(updated)

    async def list_managers(self, skip: int = 0, limit: int = 100) -> list[ManagerResponse]:
        """
        List all facility managers with pagination.
        """
        managers = await self.user_repository.list_managers(skip=skip, limit=limit)
        return [ManagerResponse.model_validate(manager) for manager in managers]

    async def get_manager_by_id(self, manager_id: int) -> ManagerResponse:
        """
        Retrieve a facility manager by ID.
        """
        manager = await self.user_repository.get_manager_by_id(manager_id)
        if not manager:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manager not found")
        return ManagerResponse.model_validate(manager)

    async def create_manager(self, manager_create: ManagerCreate) -> ManagerResponse:
        """
        Create a new facility manager.
        """
        existing = await self.user_repository.get_by_email(manager_create.email)
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

        hashed_password = Security.hash_password(manager_create.password)
        new_manager = await self.user_repository.create_manager(manager_create, hashed_password)
        return ManagerResponse.model_validate(new_manager)

    async def update_manager(self, manager_id: int, manager_update: ManagerUpdate) -> ManagerResponse:
        """
        Update an existing facility manager's information.
        """
        manager = await self.user_repository.get_manager_by_id(manager_id)
        if not manager:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manager not found")

        update_data = {}
        
        if manager_update.email is not None:
            email = manager_update.email.strip()
            if email != manager.email:
                existing = await self.user_repository.get_by_email(email)
                if existing:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
            update_data["email"] = email

        if manager_update.fullname is not None:
            update_data["fullname"] = manager_update.fullname.strip()

        if manager_update.idnum is not None:
            update_data["idnum"] = manager_update.idnum.strip()

        if manager_update.work_unit is not None:
            update_data["work_unit"] = manager_update.work_unit.strip()

        if manager_update.password is not None:
            update_data["hashed_password"] = Security.hash_password(manager_update.password)

        if manager_update.is_active is not None:
            update_data["is_active"] = manager_update.is_active

        if not update_data:
            return ManagerResponse.model_validate(manager)

        updated_manager = await self.user_repository.update_manager(manager_id, **update_data)
        return ManagerResponse.model_validate(updated_manager)

    async def delete_manager(self, manager_id: int) -> bool:
        """
        Delete a facility manager.
        """
        manager = await self.user_repository.get_manager_by_id(manager_id)
        if not manager:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manager not found")

        return await self.user_repository.delete_manager(manager_id)
    