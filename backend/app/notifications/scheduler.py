from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.database import SessionLocal
from app.services.notification_service import create_due_task_reminders

scheduler = BackgroundScheduler()


def _run_reminder_job() -> None:
    db = SessionLocal()
    try:
        create_due_task_reminders(db)
    finally:
        db.close()


def start_scheduler() -> None:
    if scheduler.running:
        return

    scheduler.add_job(_run_reminder_job, IntervalTrigger(minutes=30), id="due-task-reminders", replace_existing=True)
    scheduler.start()


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
