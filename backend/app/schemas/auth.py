from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserOut


class UserRegister(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=120)
    mobile_number: str = Field(min_length=7, max_length=24)
    password: str = Field(min_length=8, max_length=128)


class VerifyRegistrationCode(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=10)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    id_token: str = Field(min_length=20)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=16)
    new_password: str = Field(min_length=8, max_length=128)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MessageResponse(BaseModel):
    message: str
    debug_code: str | None = None
    debug_reset_link: str | None = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
