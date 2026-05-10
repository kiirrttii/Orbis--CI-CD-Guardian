"""
Authentication endpoints.
Routes for login, user retrieval, verification, and logout.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.config import settings
from app.core.security import create_access_token, verify_password, hash_password
from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse, VerifyResponse, SignupRequest

router = APIRouter()

@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def signup(
    request: SignupRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.email == request.email)
    result = await db.execute(stmt)
    existing_user = result.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    new_user = User(
        email=request.email,
        hashed_password=hash_password(request.password),
        full_name=request.full_name,
        is_active=True
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name
    )

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and get JWT token",
)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    print(f"[Auth] Login request for email: {request.email}")
    stmt = select(User).where(User.email == request.email)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        print(f"[Auth] User not found: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User does not exist, please sign up",
        )
    
    if not verify_password(request.password, user.hashed_password):
        print(f"[Auth] Password mismatch for: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    access_token = create_access_token(subject=str(user.id))
    
    response_data = TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name
        )
    )

    from fastapi import Response
    response = Response(content=response_data.model_dump_json(), media_type="application/json")
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=False,  # Allow JS to see it for checkAuth
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
        samesite="lax"
    )
    return response

from app.schemas.user import UserDetailedResponse, UserUpdate
from app.services.user_service import UserService

@router.get(
    "/me",
    response_model=UserDetailedResponse,
    summary="Get current authenticated user with full details",
)
async def read_users_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    return service.map_to_detailed_response(current_user)

@router.put(
    "/me",
    response_model=UserDetailedResponse,
    summary="Update current user profile and preferences",
)
async def update_user_me(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    updated_user = await service.update_user(current_user, update_data)
    return service.map_to_detailed_response(updated_user)

@router.get(
    "/verify",
    response_model=VerifyResponse,
    summary="Verify token validity",
)
async def verify_token(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    return VerifyResponse(
        valid=True,
        user=UserResponse(
            id=current_user.id,
            email=current_user.email,
            full_name=current_user.full_name
        )
    )

@router.post(
    "/logout",
    summary="Logout user (frontend stub)",
)
async def logout():
    """
    Since we are using stateless JWTs, the backend doesn't invalidate them natively.
    This endpoint serves as a standard hook for the frontend to clear its session state.
    """
    return {"message": "Successfully logged out"}
