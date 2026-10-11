import time
import uuid
import logging
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware

from backend.app.config import settings
from backend.app.database import engine, Base
from backend.app.routers import auth, files, shares, dashboard, health

# Configure structured logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s (req_id=%(request_id)s): %(message)s" if "%(request_id)s" in "" else "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("cloudvault")

# Initialize database tables on startup (creates tables if they don't exist yet)
Base.metadata.create_all(bind=engine)

# Disable Swagger UI in strict production mode if desired
docs_url = "/docs" if settings.ENVIRONMENT != "production" else None
redoc_url = "/redoc" if settings.ENVIRONMENT != "production" else None

app = FastAPI(
    title="CloudVault API",
    description="Secure, production-grade cloud file storage and sharing REST backend.",
    version="1.0.0",
    docs_url=docs_url,
    redoc_url=redoc_url
)


# Security Headers & Logging Middleware
class SecurityAndLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        req_id = str(uuid.uuid4())[:8]
        start_time = time.time()

        # Sanitize path for logging
        logger.info(f"[{req_id}] INCOMING {request.method} {request.url.path}")

        response = await call_next(request)

        duration_ms = round((time.time() - start_time) * 1000, 2)
        logger.info(f"[{req_id}] COMPLETED {response.status_code} in {duration_ms}ms")

        # Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-Request-ID"] = req_id

        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response


app.add_middleware(SecurityAndLoggingMiddleware)

# CORS Middleware with strict origin validation
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "X-Request-ID"]
)


# Global Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Formats validation errors into clean user-friendly JSON."""
    details = []
    for err in exc.errors():
        loc = " -> ".join([str(x) for x in err.get("loc", []) if x != "body"])
        msg = err.get("msg", "Invalid value")
        details.append(f"{loc}: {msg}" if loc else msg)

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "The submitted data failed validation.",
            "details": details
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catches unhandled errors without leaking stack traces or internal secrets."""
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred while processing your request. Please try again later."
        }
    )


# Register Routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(files.router)
app.include_router(shares.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {
        "service": "CloudVault API",
        "status": "operational",
        "documentation": "/docs" if docs_url else "disabled"
    }
