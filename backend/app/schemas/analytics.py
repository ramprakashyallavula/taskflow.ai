from pydantic import BaseModel


class AnalyticsSummary(BaseModel):
    total_tasks: int
    completed_tasks: int
    overdue_tasks: int
    completion_rate: float
    tasks_by_priority: dict[str, int]
    tasks_by_status: dict[str, int]
