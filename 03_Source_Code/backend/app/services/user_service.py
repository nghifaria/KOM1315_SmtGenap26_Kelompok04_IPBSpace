from fastapi import HTTPException, status

from app.repositories.user_repository import UserRepository
from app.schemas.user import UserResponse

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