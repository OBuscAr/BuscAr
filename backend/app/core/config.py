from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Olho Vivo
    SPTRANS_PREFIX_URL: str = ""
    SPTRANS_API_TOKEN: str = ""

    # MyClimate
    MYCLIMATE_USERNAME: str = ""
    MYCLIMATE_PASSWORD: str = ""
    MYCLIMATE_PREFIX_URL: str = ""
    ENABLE_MYCLIMATE_FALLBACK: bool = True

    # Database
    DATABASE_URL: str = ""

    # Security
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
