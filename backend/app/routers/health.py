from fastapi import APIRouter
from backend.app.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check():
    """Health check endpoint for load balancers (AWS ALB) and monitoring."""
    return {
        "status": "healthy",
        "service": "CloudVault API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "storage_backend": settings.STORAGE_BACKEND
    }
