"""Application configuration using Pydantic settings."""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database settings
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/twilio_number_search"
    
    # Twilio settings (required - must be set in environment variables)
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    
    # Application settings
    app_name: str = "Twilio Number Search API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # API settings
    api_v1_prefix: str = "/api/v1"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

