from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import TaskPriority, TaskStatus


class ParseTaskRequest(BaseModel):
    text: str = Field(min_length=3, max_length=2000)


class ParsedTask(BaseModel):
    title: str
    description: str | None = None
    status: TaskStatus = TaskStatus.todo
    priority: TaskPriority = TaskPriority.medium
    due_date: datetime | None = None
    estimated_minutes: int | None = None


class ParseTaskResponse(BaseModel):
    task: ParsedTask
    source: str


class BreakdownTaskRequest(BaseModel):
    title: str = Field(min_length=2, max_length=180)
    description: str | None = None


class BreakdownTaskResponse(BaseModel):
    subtasks: list[str]
    source: str


class ScheduleItem(BaseModel):
    task_id: int | None
    title: str
    start_time: str
    end_time: str


class GenerateScheduleRequest(BaseModel):
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")


class GenerateScheduleResponse(BaseModel):
    schedule: list[ScheduleItem]
    source: str
