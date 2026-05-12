from datetime import datetime

from pydantic import EmailStr

from app.schemas.common import ORMBase


class UserOut(ORMBase):
    id: int
    email: EmailStr
    full_name: str
    mobile_number: str | None = None
    auth_provider: str
    is_email_verified: bool
    is_active: bool
    created_at: datetime
