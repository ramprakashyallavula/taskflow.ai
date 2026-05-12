from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import TaskPriority, TaskStatus
from app.schemas.common import ORMBase


class TaskCreate(BaseModel):
    title: str = Field(min_length=2, max_length=180)
    description: str | None = Field(default=None, max_length=2000)
    status: TaskStatus = TaskStatus.todo
    priority: TaskPriority = TaskPriority.medium
    due_date: datetime | None = None
    estimated_minutes: int | None = Field(default=None, ge=5, le=24 * 60)
    project_id: int | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=180)
    description: str | None = Field(default=None, max_length=2000)
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_date: datetime | None = None
    estimated_minutes: int | None = Field(default=None, ge=5, le=24 * 60)
    project_id: int | None = None


class TaskOut(ORMBase):
    id: int
    user_id: int
    project_id: int | None
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    due_date: datetime | None
    estimated_minutes: int | None
    created_at: datetime
    updated_at: datetime
