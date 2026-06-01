import datetime
from typing import Dict, Any, Tuple
import bcrypt
import os
from fastapi import HTTPException, status
from jwt import encode, decode, ExpiredSignatureError, InvalidTokenError
from jwt import PyJWTError as JWTError

class Security:
    """Handles all security-related operations."""

    SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt."""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a plain password against a hashed password."""
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: int = 25200) -> str:
        """
        Create a JWT access token.
        
        :param data: The data to include in the token (e.g., user ID, role).
        :type data: Dict[str, Any]
        :param expires_delta: Expiration time in seconds (default is 7 hours).
        :type expires_delta: int
        :return: Encoded JWT access token as a string
        :rtype: str
        """
        to_encode = data.copy()

        if expires_delta:
            expires = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=expires_delta)
        else:
            expires = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))) # Default to 15 minutes if not set

        to_encode.update({"exp": expires, "type": "access"})

        # Encode the token
        encoded_jwt = encode(
            to_encode, 
            os.getenv("SECRET_KEY", "fallback_secret_key"), 
            algorithm=os.getenv("ALGORITHM", "HS256")
        )
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(data: Dict[str, Any]) -> str:
        """
        Create a JWT refresh token.
        
        :param data: The data to include in the token (e.g., user ID, role).
        :type data: Dict[str, Any]
        :return: Encoded JWT refresh token as a string
        :rtype: str
        """
        to_encode = data.copy()
        expires = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))) # Default to 7 days if not set

        to_encode.update({"exp": expires, "type": "refresh"})

        encoded_jwt = encode(
            to_encode, 
            os.getenv("SECRET_KEY", "fallback_secret_key"), 
            algorithm=os.getenv("ALGORITHM", "HS256")
        )
        return encoded_jwt
    
    @staticmethod
    def create_token_pair(data: Dict[str, Any]) -> Tuple[str, str]:
        """
        Create both access and refresh tokens for a user.
                
        :param data: The data to include in the tokens (e.g., user ID, role).
        :type data: Dict[str, Any]
        :return: A tuple containing the access token and refresh token as strings
        :rtype: Tuple[str, str]
        """
        access_token = Security.create_access_token(data)
        refresh_token = Security.create_refresh_token(data)
        return access_token, refresh_token
    
    @staticmethod
    def decode_token(token: str) -> Dict[str, Any]:
        """
        Decode a JWT token and return its payload.
        
        :param token: The JWT token to decode.
        :type token: str
        :return: The decoded payload of the token as a dictionary
        :rtype: Dict[str, Any]
        :raises JWTError: If the token is invalid or expired
        """
        # print(f"Decoding token in security.py -> decode_token: {token}")  # Debug statement to check the token being decoded
        # print(f"Token segments: {token.count('.') + 1 if token else 0}")

        try:
            payload = decode(
                token, 
                os.getenv("SECRET_KEY", "fallback_secret_key"), 
                algorithms=[os.getenv("ALGORITHM", "HS256")]
            )

            # # print(f"Decoded payload here: {payload}")  # Debug statement to check the decoded payload

            # Check if token has expired
            exp = payload.get("exp")
            if exp is None or datetime.datetime.fromtimestamp(exp, datetime.timezone.utc) < datetime.datetime.now(datetime.timezone.utc):
                raise JWTError("Token has expired")

            return payload
        except ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
    @staticmethod
    def verify_token_type(token_type: str, expected_type: str) -> bool:
        """
        Verify that a token is of the expected type (access or refresh).
        
        :param token_type: The type of the token to verify (e.g., "access" or "refresh").
        :type token_type: str
        :param expected_type: The expected type of the token ("access" or "refresh").
        :type expected_type: str
        :return: True if the token is valid and of the expected type, False otherwise
        :rtype: bool
        :raises HTTPException: If the token is invalid, expired, or of the wrong type
        """
        if token_type != expected_type:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token type: expected '{expected_type}' but got '{token_type}'",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return True