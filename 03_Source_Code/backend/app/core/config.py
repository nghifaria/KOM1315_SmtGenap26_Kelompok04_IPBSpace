import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    BASE_URL: str = os.getenv("BASE_URL", "http://localhost:8000")
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "onboarding@resend.dev")
    MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME", "IPB Space")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "")

settings = Settings()

