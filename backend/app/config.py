from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    supabase_url: str
    supabase_service_key: str
    supabase_bucket: str = "pcb-vision"
    jwt_secret: str
    jwt_expire_hours: int = 24
    admin_email: str = "world.usman.business@gmail.com"
    admin_password: str = ""
    cors_origins: str = "http://localhost:3000,https://pcb-fault-detection-system.vercel.app"

    # SMTP Email Configuration
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False
    smtp_timeout: int = 15
    admin_notification_email: str = "world.usman.business@gmail.com"
    app_base_url: str = "https://pcb-fault-detection-system.vercel.app"


    model_config = SettingsConfigDict(env_file=(".env", "backend/.env"), extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
