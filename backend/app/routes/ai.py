from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.enums import TaskStatus
from app.models.task import Task
from app.models.user import User
from app.schemas.ai import (
    BreakdownTaskRequest,
    BreakdownTaskResponse,
    GenerateScheduleRequest,
    GenerateScheduleResponse,
    ParseTaskRequest,
    ParseTaskResponse,
)
from app.services.ai_service import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/parse-task", response_model=ParseTaskResponse)
def parse_task(
    payload: ParseTaskRequest,
    current_user: User = Depends(get_current_user),
) -> ParseTaskResponse:
    _ = current_user
    parsed_task, source = ai_service.parse_task(payload.text)
    return ParseTaskResponse(task=parsed_task, source=source)


@router.post("/breakdown-task", response_model=BreakdownTaskResponse)
def breakdown_task(
    payload: BreakdownTaskRequest,
    current_user: User = Depends(get_current_user),
) -> BreakdownTaskResponse:
    _ = current_user
    subtasks, source = ai_service.breakdown_task(payload.title, payload.description)
    return BreakdownTaskResponse(subtasks=subtasks, source=source)


@router.post("/generate-schedule", response_model=GenerateScheduleResponse)
def generate_schedule(
    payload: GenerateScheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GenerateScheduleResponse:
    tasks = (
        db.query(Task)
        .filter(Task.user_id == current_user.id, Task.status != TaskStatus.done)
        .order_by(Task.due_date.asc().nulls_last())
        .all()
    )
    schedule, source = ai_service.generate_schedule(payload.date, tasks)
    return GenerateScheduleResponse(schedule=schedule, source=source)
