import logging
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.schemas.user import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse
)
from backend.app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    """Registers a new user account with Argon2id password hashing."""
    # Check if user already exists
    normalized_email = req.email.lower().strip()
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        logger.warning(f"Registration attempt with existing email: {normalized_email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Hash password with Argon2id
    pwd_hash = hash_password(req.password)

    new_user = User(
        full_name=req.full_name.strip(),
        email=normalized_email,
        password_hash=pwd_hash,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info(f"Registered new user account: {new_user.id} ({new_user.email})")

    # Generate access token
    access_token = create_access_token(
        data={"sub": new_user.id, "email": new_user.email, "name": new_user.full_name}
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=TokenResponse)
def login_user(req: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticates a user and issues a short-lived signed JWT access token."""
    normalized_email = req.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()

    # Constant-time mitigation against user enumeration
    if not user or not verify_password(req.password, user.password_hash):
        logger.warning(f"Failed login attempt for email: {normalized_email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or disabled."
        )

    logger.info(f"User logged in successfully: {user.id}")

    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "name": user.full_name}
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )


@router.post("/logout")
def logout_user(current_user: User = Depends(get_current_user)):
    """Logs out the user and invalidates local authentication state."""
    logger.info(f"User logged out: {current_user.id}")
    return {"message": "Logged out successfully."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns profile details for the currently authenticated user."""
    return UserResponse.model_validate(current_user)
