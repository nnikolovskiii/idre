import os
from datetime import datetime, timedelta, timezone
import uuid
import requests

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Response
from fastapi.params import Depends
from pydantic import BaseModel, EmailStr
import jwt
from fastapi import Request
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from backend.api.dependencies import get_user_service
from backend.models.user import User
from backend.container import container
from backend.services.user_service import UserService

router = APIRouter()

load_dotenv()
secret = os.getenv("JWT_SECRET")
algorithm = os.getenv("ALGORITHM")
google_client_id = os.getenv("GOOGLE_CLIENT_ID")


class UserRegistration(BaseModel):
    email: str
    username: str
    password: str
    name: str
    surname: str


@router.post("/register")
async def register(
        user_data: UserRegistration,
        response: Response,
        user_service: UserService = Depends(get_user_service)
):
    password_service = container.password_service()

    # Check if email already exists
    user_exists = await user_service.get_user_by_email(user_data.email)
    if user_exists:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if username already exists
    username_exists = await user_service.get_user_by_username(user_data.username)
    if username_exists:
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_password = password_service.get_password_hash(user_data.password)
    user = await user_service.create_user(
        email=user_data.email,
        username=user_data.username,
        password=hashed_password,
        name=user_data.name,
        surname=user_data.surname,
    )

    # Generate JWT token for the new user
    expires = datetime.now(timezone.utc) + timedelta(minutes=60 * 24)  # 24 hours
    jwt_token = jwt.encode(
        {"sub": str(user.user_id), "exp": expires}, secret, algorithm=algorithm
    )

    response.set_cookie(
        key="access_token",
        value=f"Bearer {jwt_token}",
        samesite='none',
        secure=True,
        httponly=True,
        max_age=24 * 60 * 60,  # 24 hours in seconds
        expires=expires
    )

    return {"status": "success", "message": "Registration successful",
            "data": {"access_token": jwt_token, "token_type": "bearer"}}


class UserLogin(BaseModel):
    identifier: str  # Can be either email or username
    password: str
    remember_me: bool = False  # Optional field, defaults to False


class GoogleAuth(BaseModel):
    token: str  # Google ID token


@router.post("/login")
async def login(
        user_data: UserLogin,
        response: Response,
        user_service: UserService = Depends(get_user_service)
):
    password_service = container.password_service()

    # Try to find user by either email or username
    user = await user_service.get_user_by_email_or_username(user_data.identifier)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    is_password_correct = password_service.verify_password(
        user_data.password, user.hashed_password
    )
    if not is_password_correct:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.is_google_auth:
        raise HTTPException(status_code=400, detail="Please use Google login")

    # Set expiration based on remember_me flag
    if user_data.remember_me:
        expires = datetime.now(timezone.utc) + timedelta(days=365)  # 1 year
    else:
        expires = datetime.now(timezone.utc) + timedelta(minutes=60 * 24)  # 24 hours

    jwt_token = jwt.encode(
        {"sub": str(user.user_id), "exp": expires}, secret, algorithm=algorithm
    )
    # Set cookie max_age based on remember_me flag
    if user_data.remember_me:
        max_age = 365 * 24 * 60 * 60  # 1 year in seconds
    else:
        max_age = 24 * 60 * 60  # 24 hours in seconds

    response.set_cookie(
        key="access_token",
        value=f"Bearer {jwt_token}",
        samesite='none',
        secure=True,
        httponly=True,
        max_age=max_age,
        expires=expires
    )
    return {"status": "success", "message": "Login successful",
            "data": {"access_token": jwt_token, "token_type": "bearer"}}


@router.post("/google")
async def google_auth(
        auth_data: GoogleAuth,
        response: Response,
        user_service: UserService = Depends(get_user_service)
):
    try:
        # --- NEW LOGIC START ---
        # Instead of verifying ID token, we fetch user info using the Access Token
        user_info_url = "https://www.googleapis.com/oauth2/v3/userinfo"
        user_info_response = requests.get(
            user_info_url,
            headers={"Authorization": f"Bearer {auth_data.token}"}
        )

        if not user_info_response.ok:
            raise ValueError("Failed to validate token with Google")

        google_data = user_info_response.json()

        email = google_data.get('email')
        if not email:
            raise ValueError("Email not found in Google data")

        # Map Google data to our variables
        google_id = google_data.get('sub')
        name = google_data.get('given_name', '')
        surname = google_data.get('family_name', '')
        # --- NEW LOGIC END ---

        # Check if user exists by email
        user = await user_service.get_user_by_email(email)

        if user:
            # Existing user - check if they have Google auth enabled
            if not user.is_google_auth:
                # Link Google account to existing user
                await user_service.update_user_google_auth(user.user_id, True)
        else:
            # New user - create account
            username = email.split('@')[0]  # Use email prefix as username
            # Ensure username is unique
            existing_username = await user_service.get_user_by_username(username)
            if existing_username:
                username = f"{username}_{uuid.uuid4().hex[:8]}"

            await user_service.create_user(
                email=email,
                username=username,
                password=None,  # No password for Google users
                name=name,
                surname=surname,
                is_google_auth=True
            )
            user = await user_service.get_user_by_email(email)

        # Generate JWT token
        expires = datetime.now(timezone.utc) + timedelta(days=365)
        jwt_token = jwt.encode(
            {"sub": str(user.user_id), "exp": expires}, secret, algorithm=algorithm
        )

        response.set_cookie(
            key="access_token",
            value=f"Bearer {jwt_token}",
            samesite='none',
            secure=True,
            httponly=True,
            max_age=365 * 24 * 60 * 60,
            expires=expires
        )

        return {"status": "success", "message": "Google authentication successful",
                "data": {"access_token": jwt_token, "token_type": "bearer"}}

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

@router.post("/logout")
async def logout(request: Request, response: Response):
    try:
        # Get the current token to verify it exists
        token = request.cookies.get("access_token")

        # Delete the authentication cookie with proper security attributes
        response.delete_cookie(
            key="access_token",
            samesite='none',
            secure=True,
            httponly=True
        )

        # Clear any potential fallback Authorization header
        response.headers["Authorization"] = ""

        return {
            "status": "success",
            "message": "Logged out successfully",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "had_token": bool(token)
        }
    except Exception as e:
        # Even if there's an error, try to delete the cookie
        try:
            response.delete_cookie(
                key="access_token",
                samesite='none',
                secure=True,
                httponly=True
            )
        except:
            pass

        return {
            "status": "partial_success",
            "message": "Logout completed with warnings",
            "warning": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


async def get_current_user(
        request: Request,
        user_service: UserService = Depends(get_user_service)
) -> User:
    token = request.cookies.get("access_token")
    if not token:
        # Check Authorization header as fallback
        auth_header = request.headers.get("Authorization")
        if auth_header:
            token = auth_header
        else:
            raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        token = token.replace("Bearer ", "").strip()
        payload = jwt.decode(token, secret, algorithms=[algorithm])
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(status_code=401, detail="Invalid token: subject missing")
        user_id = uuid.UUID(user_id_str)
    except (jwt.PyJWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/me")
async def get_protected_data(current_user: User = Depends(get_current_user)):
    return {
        "status": "success",
        "message": "User data retrieved",
        "data": {
            "email": current_user.email,
            "username": current_user.username,
            "name": current_user.name,
            "surname": current_user.surname,
        }
    }
