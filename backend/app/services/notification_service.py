from datetime import datetime, timedelta

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.notification import Notification
from app.models.task import Task

settings = get_settings()


def create_due_task_reminders(db: Session) -> int:
    now = datetime.utcnow()
    horizon = now + timedelta(hours=settings.reminder_hours_ahead)

    due_tasks = (
        db.query(Task)
        .filter(
            Task.status != "done",
            Task.due_date.isnot(None),
            Task.due_date >= now,
            Task.due_date <= horizon,
        )
        .all()
    )

    created_count = 0
    for task in due_tasks:
        existing = (
            db.query(Notification)
            .filter(
                and_(
                    Notification.user_id == task.user_id,
                    Notification.task_id == task.id,
                    Notification.title == "Task due soon",
                )
            )
            .first()
        )
        if existing:
            continue

        due_str = task.due_date.strftime("%Y-%m-%d %H:%M") if task.due_date else "soon"
        notification = Notification(
            user_id=task.user_id,
            task_id=task.id,
            title="Task due soon",
            message=f"{task.title} is due at {due_str}.",
        )
        db.add(notification)
        created_count += 1

    if created_count:
        db.commit()

    return created_count
