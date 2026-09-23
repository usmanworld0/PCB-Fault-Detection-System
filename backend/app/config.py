from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    supabase_url: str
    supabase_service_key: str
    supabase_bucket: str = "pcb-vision"
    jwt_secret: str
    jwt_expire_hours: int = 24
    admin_email: str = "admin@example.com"
    admin_password: str = "changeme"
    cors_origins: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=(".env", "backend/.env"), extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
