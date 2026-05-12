from datetime import datetime

from app.schemas.common import ORMBase


class NotificationOut(ORMBase):
    id: int
    user_id: int
    task_id: int | None
    title: str
    message: str
    is_read: bool
    created_at: datetime
