from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "TaskFlow AI API"
    app_version: str = "1.0.0"
    debug: bool = True
    testing: bool = False
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql+psycopg2://postgres:postgres@db:5432/taskflow"

    secret_key: str = "change-this-secret"
    access_token_expire_minutes: int = 60 * 24
    algorithm: str = "HS256"

    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"

    reminder_hours_ahead: int = 24

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
