import os
import io
import logging
from abc import ABC, abstractmethod
from typing import Optional, BinaryIO
import boto3
from botocore.exceptions import ClientError, BotoCoreError
from fastapi import HTTPException, status
from backend.app.config import settings

logger = logging.getLogger(__name__)


class BaseStorageService(ABC):
    """Abstract storage interface for CloudVault file handling."""

    @abstractmethod
    def upload_file(self, storage_key: str, data: bytes, content_type: str) -> None:
        """Uploads file content to storage."""
        pass

    @abstractmethod
    def download_file(self, storage_key: str) -> bytes:
        """Retrieves raw file bytes from storage."""
        pass

    @abstractmethod
    def delete_file(self, storage_key: str) -> None:
        """Deletes a file object from storage."""
        pass

    @abstractmethod
    def generate_presigned_download_url(
        self, storage_key: str, filename: str, expires_in: int = 900
    ) -> Optional[str]:
        """Generates a secure temporary presigned download URL if supported."""
        pass


class S3StorageService(BaseStorageService):
    """Amazon S3 production storage provider using Boto3."""

    def __init__(self):
        client_kwargs = {
            "region_name": settings.AWS_REGION
        }
        if settings.AWS_ENDPOINT_URL:
            client_kwargs["endpoint_url"] = settings.AWS_ENDPOINT_URL
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            client_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
            client_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY

        self.bucket_name = settings.S3_BUCKET_NAME
        try:
            self.s3_client = boto3.client("s3", **client_kwargs)
            logger.info(f"Initialized S3 Storage client for bucket: {self.bucket_name}")
        except Exception as e:
            logger.error(f"Failed to initialize S3 client: {e}")
            raise

    def upload_file(self, storage_key: str, data: bytes, content_type: str) -> None:
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=storage_key,
                Body=data,
                ContentType=content_type,
                ServerSideEncryption="AES256"  # Enforce S3 SSE-S3 encryption at rest
            )
            logger.info(f"Successfully uploaded object {storage_key} to S3 bucket {self.bucket_name}")
        except (ClientError, BotoCoreError) as e:
            logger.error(f"S3 upload failed for {storage_key}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Cloud storage service unavailable for upload. Please try again later."
            )

    def download_file(self, storage_key: str) -> bytes:
        try:
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=storage_key
            )
            return response["Body"].read()
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code")
            logger.error(f"S3 download failed for {storage_key}: {error_code} - {e}")
            if error_code == "NoSuchKey":
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found in storage.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve file from cloud storage."
            )
        except BotoCoreError as e:
            logger.error(f"Boto3 core error during download {storage_key}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Cloud storage error."
            )

    def delete_file(self, storage_key: str) -> None:
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=storage_key
            )
            logger.info(f"Successfully deleted object {storage_key} from S3 bucket {self.bucket_name}")
        except (ClientError, BotoCoreError) as e:
            logger.error(f"S3 delete failed for {storage_key}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to remove file from cloud storage."
            )

    def generate_presigned_download_url(
        self, storage_key: str, filename: str, expires_in: int = 900
    ) -> Optional[str]:
        try:
            url = self.s3_client.generate_presigned_url(
                ClientMethod="get_object",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": storage_key,
                    "ResponseContentDisposition": f'attachment; filename="{filename}"'
                },
                ExpiresIn=expires_in
            )
            return url
        except (ClientError, BotoCoreError) as e:
            logger.warning(f"Could not generate presigned URL for {storage_key}: {e}")
            return None


class LocalStorageService(BaseStorageService):
    """Local filesystem storage provider for development and automated testing."""

    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = os.path.abspath(base_dir or settings.LOCAL_STORAGE_PATH)
        os.makedirs(self.base_dir, exist_ok=True)
        logger.info(f"Initialized Local Storage at {self.base_dir}")

    def _resolve_path(self, storage_key: str) -> str:
        safe_key = os.path.basename(storage_key)
        target = os.path.join(self.base_dir, safe_key)
        # Ensure path stays within base directory
        if not os.path.abspath(target).startswith(self.base_dir):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid storage path key.")
        return target

    def upload_file(self, storage_key: str, data: bytes, content_type: str) -> None:
        try:
            target_path = self._resolve_path(storage_key)
            os.makedirs(os.path.dirname(target_path), exist_ok=True)
            with open(target_path, "wb") as f:
                f.write(data)
            logger.info(f"Saved local file {storage_key}")
        except Exception as e:
            logger.error(f"Local storage upload failed for {storage_key}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Local storage write failure."
            )

    def download_file(self, storage_key: str) -> bytes:
        target_path = self._resolve_path(storage_key)
        if not os.path.exists(target_path):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found in storage.")
        try:
            with open(target_path, "rb") as f:
                return f.read()
        except Exception as e:
            logger.error(f"Local storage read failed for {storage_key}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Local storage read failure."
            )

    def delete_file(self, storage_key: str) -> None:
        target_path = self._resolve_path(storage_key)
        if os.path.exists(target_path):
            try:
                os.remove(target_path)
                logger.info(f"Deleted local file {storage_key}")
            except Exception as e:
                logger.error(f"Local storage delete failed for {storage_key}: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Local storage delete failure."
                )

    def generate_presigned_download_url(
        self, storage_key: str, filename: str, expires_in: int = 900
    ) -> Optional[str]:
        # Local storage does not support direct AWS presigned URLs, downloads will stream via API
        return None


# Global singleton instance caching
_storage_service: Optional[BaseStorageService] = None


def get_storage_service() -> BaseStorageService:
    """Returns the configured storage provider (S3 or Local)."""
    global _storage_service
    if _storage_service is None:
        if settings.STORAGE_BACKEND == "s3":
            _storage_service = S3StorageService()
        else:
            _storage_service = LocalStorageService()
    return _storage_service
