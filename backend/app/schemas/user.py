from datetime import datetime

from pydantic import EmailStr

from app.schemas.common import ORMBase


class UserOut(ORMBase):
    id: int
    email: EmailStr
    full_name: str
    is_active: bool
    created_at: datetime
