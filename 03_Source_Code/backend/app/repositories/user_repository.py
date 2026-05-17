from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional, Any
from sqlalchemy.sql import func
import datetime

from app.models.user import User
from app.schemas.user import UserCreate

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_users(self, skip: int = 0, limit: int = 100) -> list[User]:
        result = await self.db.execute(select(User).offset(skip).limit(limit))
        return list(result.scalars().all())

    async def get_by_id(self, user_id: int) -> Optional[User]:
        """
        Retrieve a user by their ID.
    
        :param user_id: The ID of the user to retrieve
        :type user_id: int
        :return: The User object if found, otherwise None
        :rtype: Optional[User]
        """
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """
        Retrieve a user by their email address.
    
        :param email: The email address of the user to retrieve
        :type email: str
        :return: The User object if found, otherwise None
        :rtype: Optional[User]
        """
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def create(self, user_create: UserCreate, hashed_password: str) -> User:
        """
        Create a new user in the database.
    
        :param user_create: The UserCreate schema containing user information for creation
        :type user_create: UserCreate
        :param hashed_password: The hashed password to store for the user
        :type hashed_password: str
        :return: The newly created User object
        :rtype: User
        """
        new_user = User(
            email=user_create.email,
            fullname=user_create.fullname,
            idnum=user_create.idnum,
            hashed_password=hashed_password,
            role=user_create.role.value if user_create.role else None,  # Convert enum to string
            created_at=datetime.datetime.now()
        )
        self.db.add(new_user)
        await self.db.commit()
        await self.db.refresh(new_user)
        return new_user
    
    async def update_last_login(self, user_id: int) -> None:
        """
        Update the last login timestamp for a user.
    
        :param user_id: The ID of the user to update
        :type user_id: int
        """
        user = await self.get_by_id(user_id)
        if user:
            user.last_login = func.now()
            await self.db.commit()

    async def refresh(self, user_id: int) -> Optional[User]:
        """
        Refresh the user instance from the database to get the latest data.
    
        :param user_id: The ID of the user to refresh
        :type user_id: int
        :return: The refreshed User object if found, otherwise None
        :rtype: Optional[User]
        """
        user = await self.get_by_id(user_id)
        if user:
            await self.db.refresh(user)
            return user
        return None

    async def update(self, user_id: int, **kwargs: Any) -> Optional[User]:
        """
        Update user information based on provided keyword arguments.
    
        :param user_id: The ID of the user to update
        :type user_id: int
        :param kwargs: Key-value pairs of fields to update (e.g., fullname, email, role)
        :type kwargs: dict
        :return: The updated User object if the user exists, otherwise None
        :rtype: Optional[User]
        """
        user = await self.get_by_id(user_id)
        if not user:
            return None
        for key, value in kwargs.items():
            setattr(user, key, value)
        user.updated_at = datetime.datetime.now()
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def delete(self, user_id: int) -> bool:
        """
        Delete a user from the database.
    
        :param user_id: The ID of the user to delete
        :type user_id: int
        :return: True if the user was deleted, False if the user was not found
        :rtype: bool
        """
        user = await self.get_by_id(user_id)
        if not user:
            return False
        await self.db.delete(user)
        await self.db.commit()
        return True
