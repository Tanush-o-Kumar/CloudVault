from typing import Any, List, Optional
import os
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    ENVIRONMENT: str = Field(default="development", description="Environment: development, test, production")
    PORT: int = Field(default=8000, description="Server port")
    HOST: str = Field(default="0.0.0.0", description="Server host")
    LOG_LEVEL: str = Field(default="INFO", description="Log level")

    # Security & JWT
    SECRET_KEY: str = Field(
        default="cloudvault-development-secret-key-replace-in-production-min32chars",
        description="Secret key for signing JWT tokens"
    )
    ALGORITHM: str = Field(default="HS256", description="JWT signing algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60, description="Token expiration in minutes")

    # Database
    DATABASE_URL: str = Field(
        default="sqlite:///./cloudvault.db",
        description="SQLAlchemy database connection URL"
    )

    # Storage Backend: 's3' or 'local'
    STORAGE_BACKEND: str = Field(default="local", description="Storage backend ('s3' or 'local')")
    LOCAL_STORAGE_PATH: str = Field(default="./data/storage", description="Path for local file storage")

    # AWS S3 Settings (Used when STORAGE_BACKEND='s3')
    AWS_REGION: str = Field(default="us-east-1", description="AWS Region")
    S3_BUCKET_NAME: str = Field(default="cloudvault-files", description="Target S3 Bucket")
    AWS_ACCESS_KEY_ID: Optional[str] = Field(default=None, description="AWS Access Key ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = Field(default=None, description="AWS Secret Access Key")
    AWS_ENDPOINT_URL: Optional[str] = Field(default=None, description="Custom endpoint URL (e.g. LocalStack)")
    PRESIGNED_URL_EXPIRATION_SECONDS: int = Field(default=900, description="Presigned URL validity in seconds (15m)")

    # Upload restrictions
    MAX_UPLOAD_SIZE_BYTES: int = Field(default=100 * 1024 * 1024, description="Max upload file size in bytes (100MB)")
    ALLOWED_EXTENSIONS: List[str] = Field(
        default=[
            "pdf", "png", "jpg", "jpeg", "gif", "webp", "svg",
            "txt", "md", "csv", "json", "docx", "xlsx", "pptx", "zip"
        ],
        description="Allowed file extensions"
    )

    # CORS
    CORS_ORIGINS: Any = Field(
        default=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
        description="List of allowed CORS origins"
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            if v.startswith("["):
                import json
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore"
    }


settings = Settings()
