from datetime import datetime, timedelta
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    generate_numeric_code,
    generate_urlsafe_token,
    get_password_hash,
    hash_secret,
    verify_password,
)
from app.database import get_db
from app.models.auth_token import EmailVerificationCode, PasswordResetToken
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    GoogleAuthRequest,
    MessageResponse,
    ResetPasswordRequest,
    UserLogin,
    UserRegister,
    VerifyRegistrationCode,
)
from app.services.email_service import send_email

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def _debug_code_response(code: str) -> str | None:
    if settings.debug or settings.testing:
        return code
    return None


def _build_google_state(next_path: str) -> str:
    payload = {
        "next": next_path,
        "nonce": generate_urlsafe_token(8),
        "exp": datetime.utcnow() + timedelta(minutes=10),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def _decode_google_state(state: str) -> str:
    try:
        payload = jwt.decode(state, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError as exc:  # pragma: no cover
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state") from exc

    next_path = payload.get("next") or "/dashboard"
    if not isinstance(next_path, str) or not next_path.startswith("/"):
        return "/dashboard"
    return next_path


def _verify_google_id_token(id_token: str) -> dict[str, str]:
    try:
        response = httpx.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": id_token},
            timeout=10.0,
        )
        response.raise_for_status()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google authentication is unavailable") from exc

    payload = response.json()
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google account email missing")

    email_verified = str(payload.get("email_verified", "")).lower() == "true"
    if not email_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google account email is not verified")

    if settings.google_client_id and payload.get("aud") != settings.google_client_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google token audience mismatch")

    return {
        "email": email.lower(),
        "full_name": payload.get("name") or "Google User",
        "google_sub": payload.get("sub"),
    }


def _auth_response_for_google_user(identity: dict[str, str], db: Session) -> AuthResponse:
    user = db.query(User).filter(User.email == identity["email"]).first()

    if not user:
        user = User(
            email=identity["email"],
            full_name=identity["full_name"],
            hashed_password=None,
            mobile_number=None,
            auth_provider="google",
            is_email_verified=True,
            google_sub=identity.get("google_sub"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        should_update = False
        if not user.is_email_verified:
            user.is_email_verified = True
            should_update = True
        if identity.get("google_sub") and user.google_sub != identity["google_sub"]:
            user.google_sub = identity["google_sub"]
            should_update = True
        if user.auth_provider == "local":
            # Keep "local" as provider if the account also has password login.
            pass
        else:
            user.auth_provider = "google"
            should_update = True
        if should_update:
            db.add(user)
            db.commit()
            db.refresh(user)

    token = create_access_token(subject=str(user.id))
    return AuthResponse(access_token=token, user=user)


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)) -> MessageResponse:
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    code = generate_numeric_code()
    hashed_password = get_password_hash(payload.password)
    code_hash = hash_secret(code)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.verification_code_expire_minutes)

    pending = db.query(EmailVerificationCode).filter(EmailVerificationCode.email == payload.email.lower()).first()
    if pending:
        pending.full_name = payload.full_name
        pending.mobile_number = payload.mobile_number
        pending.hashed_password = hashed_password
        pending.code_hash = code_hash
        pending.expires_at = expires_at
        pending.failed_attempts = 0
    else:
        pending = EmailVerificationCode(
            email=payload.email.lower(),
            full_name=payload.full_name,
            mobile_number=payload.mobile_number,
            hashed_password=hashed_password,
            code_hash=code_hash,
            expires_at=expires_at,
        )
        db.add(pending)

    db.commit()

    subject = "Your TaskFlow AI verification code"
    text_body = (
        f"Hello {payload.full_name},\n\n"
        f"Your verification code is: {code}\n"
        f"It expires in {settings.verification_code_expire_minutes} minutes.\n\n"
        "If you did not request this, you can ignore this email."
    )
    html_body = (
        f"<p>Hello {payload.full_name},</p>"
        f"<p>Your verification code is <strong>{code}</strong>.</p>"
        f"<p>It expires in {settings.verification_code_expire_minutes} minutes.</p>"
    )
    send_email(payload.email.lower(), subject, html_body, text_body)

    return MessageResponse(
        message="Verification code sent. Please check your email and verify to complete signup.",
        debug_code=_debug_code_response(code),
    )


@router.post("/register/verify", response_model=AuthResponse)
def verify_registration(payload: VerifyRegistrationCode, db: Session = Depends(get_db)) -> AuthResponse:
    pending = db.query(EmailVerificationCode).filter(EmailVerificationCode.email == payload.email.lower()).first()
    if not pending:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No verification request found for this email")

    if pending.expires_at < datetime.utcnow():
        db.delete(pending)
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code expired. Request a new code.")

    if pending.failed_attempts >= 5:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many attempts. Request a new code.")

    if pending.code_hash != hash_secret(payload.code.strip()):
        pending.failed_attempts += 1
        db.add(pending)
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code")

    existing = db.query(User).filter(User.email == pending.email).first()
    if existing:
        db.delete(pending)
        db.commit()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    user = User(
        email=pending.email,
        full_name=pending.full_name,
        hashed_password=pending.hashed_password,
        mobile_number=pending.mobile_number,
        auth_provider="local",
        is_email_verified=True,
    )
    db.add(user)
    db.delete(pending)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=str(user.id))
    return AuthResponse(access_token=token, user=user)


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Wrong email or password")

    if not user.is_email_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Please verify your email before signing in")

    token = create_access_token(subject=str(user.id))
    return AuthResponse(access_token=token, user=user)


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)) -> MessageResponse:
    generic_message = "If the email is registered, a password reset link has been sent."
    user = db.query(User).filter(User.email == payload.email.lower()).first()

    if not user or not user.is_email_verified:
        return MessageResponse(message=generic_message)

    if not user.hashed_password:
        return MessageResponse(message=generic_message)

    raw_token = generate_urlsafe_token(32)
    token_hash = hash_secret(raw_token)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.password_reset_expire_minutes)

    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at.is_(None),
    ).delete(synchronize_session=False)

    reset_token = PasswordResetToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
    db.add(reset_token)
    db.commit()

    reset_link = f"{settings.frontend_url}/reset-password?token={raw_token}"
    text_body = (
        f"Hello {user.full_name},\n\n"
        "We received a request to reset your TaskFlow AI password.\n"
        f"Reset your password here: {reset_link}\n\n"
        f"This link expires in {settings.password_reset_expire_minutes} minutes."
    )
    html_body = (
        f"<p>Hello {user.full_name},</p>"
        "<p>We received a request to reset your TaskFlow AI password.</p>"
        f"<p><a href='{reset_link}'>Reset Password</a></p>"
        f"<p>This link expires in {settings.password_reset_expire_minutes} minutes.</p>"
    )
    send_email(user.email, "TaskFlow AI password reset", html_body, text_body)

    return MessageResponse(message=generic_message, debug_reset_link=_debug_code_response(reset_link))


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)) -> MessageResponse:
    token_hash = hash_secret(payload.token)
    reset_token = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == token_hash).first()
    if not reset_token or reset_token.used_at is not None or reset_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset link is invalid or expired")

    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.hashed_password = get_password_hash(payload.new_password)
    reset_token.used_at = datetime.utcnow()
    db.add(user)
    db.add(reset_token)
    db.commit()

    return MessageResponse(message="Password updated successfully. You can sign in now.")


@router.post("/google", response_model=AuthResponse)
def google_sign_in(payload: GoogleAuthRequest, db: Session = Depends(get_db)) -> AuthResponse:
    identity = _verify_google_id_token(payload.id_token)
    return _auth_response_for_google_user(identity, db)


@router.get("/google/start")
def google_oauth_start(next: str = Query(default="/dashboard")) -> RedirectResponse:
    if not settings.google_client_id or not settings.google_redirect_uri:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google sign-in is not configured")

    state = _build_google_state(next)
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "prompt": "select_account",
    }
    google_auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return RedirectResponse(url=google_auth_url, status_code=status.HTTP_302_FOUND)


@router.get("/google/callback")
def google_oauth_callback(
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> RedirectResponse:
    login_url = f"{settings.frontend_url}/login"
    if error:
        return RedirectResponse(url=f"{login_url}?google_error={error}", status_code=status.HTTP_302_FOUND)

    if not code or not state:
        return RedirectResponse(url=f"{login_url}?google_error=missing_code", status_code=status.HTTP_302_FOUND)

    try:
        next_path = _decode_google_state(state)
    except HTTPException:
        return RedirectResponse(url=f"{login_url}?google_error=invalid_state", status_code=status.HTTP_302_FOUND)

    if not settings.google_client_id or not settings.google_client_secret or not settings.google_redirect_uri:
        return RedirectResponse(url=f"{login_url}?google_error=not_configured", status_code=status.HTTP_302_FOUND)

    try:
        token_res = httpx.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
            timeout=15.0,
        )
        token_res.raise_for_status()
        id_token = token_res.json().get("id_token")
        if not id_token:
            raise ValueError("Missing id_token")
        identity = _verify_google_id_token(id_token)
        auth_data = _auth_response_for_google_user(identity, db)
    except Exception:  # noqa: BLE001
        return RedirectResponse(url=f"{login_url}?google_error=auth_failed", status_code=status.HTTP_302_FOUND)

    next_url = f"{settings.frontend_url}/auth/google/callback?{urlencode({'token': auth_data.access_token, 'next': next_path})}"
    return RedirectResponse(url=next_url, status_code=status.HTTP_302_FOUND)
