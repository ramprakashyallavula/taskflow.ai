from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=140)
    description: str | None = Field(default=None, max_length=1000)


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=140)
    description: str | None = Field(default=None, max_length=1000)


class ProjectOut(ORMBase):
    id: int
    user_id: int
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime
