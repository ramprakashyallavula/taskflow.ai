from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.enums import TaskPriority, TaskStatus
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskOut, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskOut:
    if payload.project_id is not None:
        project = (
            db.query(Project)
            .filter(Project.id == payload.project_id, Project.user_id == current_user.id)
            .first()
        )
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    task = Task(user_id=current_user.id, **payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return TaskOut.model_validate(task)


@router.get("", response_model=list[TaskOut])
def list_tasks(
    status_filter: TaskStatus | None = Query(default=None, alias="status"),
    priority_filter: TaskPriority | None = Query(default=None, alias="priority"),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TaskOut]:
    query = db.query(Task).filter(Task.user_id == current_user.id)

    if status_filter:
        query = query.filter(Task.status == status_filter)
    if priority_filter:
        query = query.filter(Task.priority == priority_filter)
    if search:
        pattern = f"%{search.lower()}%"
        query = query.filter(Task.title.ilike(pattern) | Task.description.ilike(pattern))

    tasks = query.order_by(Task.due_date.asc().nulls_last(), Task.created_at.desc()).all()
    return [TaskOut.model_validate(task) for task in tasks]


@router.get("/{task_id}", response_model=TaskOut)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskOut:
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return TaskOut.model_validate(task)


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskOut:
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    updates = payload.model_dump(exclude_unset=True)

    if "project_id" in updates and updates["project_id"] is not None:
        project = (
            db.query(Project)
            .filter(Project.id == updates["project_id"], Project.user_id == current_user.id)
            .first()
        )
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    for key, value in updates.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return TaskOut.model_validate(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    db.delete(task)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
