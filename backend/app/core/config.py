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
    ai_provider: str = "mock"
    ollama_base_url: str = "http://host.docker.internal:11434"
    ollama_model: str = "llama3.1:8b"

    reminder_hours_ahead: int = 24
    verification_code_expire_minutes: int = 15
    password_reset_expire_minutes: int = 30

    frontend_url: str = "http://localhost:5173"

    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str = "noreply@taskflow.local"
    smtp_from_name: str = "TaskFlow AI"
    smtp_use_tls: bool = True

    google_client_id: str | None = None
    google_client_secret: str | None = None
    google_redirect_uri: str | None = None

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
