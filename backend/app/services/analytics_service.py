from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.task import Task


def get_user_analytics_summary(db: Session, user_id: int) -> dict:
    now = datetime.utcnow()

    total_tasks = db.query(func.count(Task.id)).filter(Task.user_id == user_id).scalar() or 0
    completed_tasks = (
        db.query(func.count(Task.id)).filter(Task.user_id == user_id, Task.status == "done").scalar() or 0
    )
    overdue_tasks = (
        db.query(func.count(Task.id))
        .filter(Task.user_id == user_id, Task.due_date.isnot(None), Task.due_date < now, Task.status != "done")
        .scalar()
        or 0
    )

    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks else 0

    by_priority_rows = db.query(Task.priority, func.count(Task.id)).filter(Task.user_id == user_id).group_by(Task.priority).all()
    by_status_rows = db.query(Task.status, func.count(Task.id)).filter(Task.user_id == user_id).group_by(Task.status).all()

    tasks_by_priority = {str(priority): count for priority, count in by_priority_rows}
    tasks_by_status = {str(status): count for status, count in by_status_rows}

    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "overdue_tasks": overdue_tasks,
        "completion_rate": round(completion_rate, 2),
        "tasks_by_priority": tasks_by_priority,
        "tasks_by_status": tasks_by_status,
    }
