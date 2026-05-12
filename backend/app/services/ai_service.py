import json
from datetime import datetime, time, timedelta

from openai import OpenAI

from app.core.config import get_settings
from app.models.enums import TaskPriority, TaskStatus
from app.models.task import Task
from app.schemas.ai import ParsedTask, ScheduleItem

settings = get_settings()


class AIService:
    def __init__(self) -> None:
        self.client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    def parse_task(self, text: str) -> tuple[ParsedTask, str]:
        if not self.client:
            return self._mock_parse_task(text), "mock"

        system_prompt = (
            "You convert natural language tasks into JSON with keys: title, description, "
            "status(todo|in_progress|done), priority(low|medium|high), due_date(ISO8601|null), estimated_minutes(int|null)."
        )

        try:
            response = self.client.chat.completions.create(
                model=settings.openai_model,
                temperature=0.2,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text},
                ],
                response_format={"type": "json_object"},
            )

            payload = json.loads(response.choices[0].message.content or "{}")
            parsed = ParsedTask(
                title=payload.get("title", "Untitled Task"),
                description=payload.get("description"),
                status=payload.get("status", TaskStatus.todo),
                priority=payload.get("priority", TaskPriority.medium),
                due_date=payload.get("due_date"),
                estimated_minutes=payload.get("estimated_minutes"),
            )
            return parsed, "openai"
        except Exception:
            return self._mock_parse_task(text), "mock"

    def breakdown_task(self, title: str, description: str | None) -> tuple[list[str], str]:
        if not self.client:
            return self._mock_breakdown(title), "mock"

        prompt = (
            "Break this task into 4-8 concrete subtasks. Return JSON with a `subtasks` array of short strings.\n\n"
            f"Title: {title}\nDescription: {description or ''}"
        )
        try:
            response = self.client.chat.completions.create(
                model=settings.openai_model,
                temperature=0.3,
                messages=[
                    {"role": "system", "content": "You are a productivity planner."},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
            )

            payload = json.loads(response.choices[0].message.content or "{}")
            subtasks = payload.get("subtasks") or self._mock_breakdown(title)
            return [str(item) for item in subtasks], "openai"
        except Exception:
            return self._mock_breakdown(title), "mock"

    def generate_schedule(self, date_str: str, tasks: list[Task]) -> tuple[list[ScheduleItem], str]:
        if not tasks:
            return [], "mock"

        if not self.client:
            return self._mock_schedule(date_str, tasks), "mock"

        task_payload = [
            {
                "id": t.id,
                "title": t.title,
                "priority": t.priority,
                "status": t.status,
                "estimated_minutes": t.estimated_minutes,
                "due_date": t.due_date.isoformat() if t.due_date else None,
            }
            for t in tasks
        ]

        prompt = (
            "Generate a practical daily schedule for these tasks. Return JSON with `schedule` array and entries "
            "containing: task_id, title, start_time(HH:MM), end_time(HH:MM). "
            f"Date: {date_str}. Tasks: {json.dumps(task_payload)}"
        )

        try:
            response = self.client.chat.completions.create(
                model=settings.openai_model,
                temperature=0.3,
                messages=[
                    {"role": "system", "content": "You are an expert productivity coach."},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
            )

            payload = json.loads(response.choices[0].message.content or "{}")
            raw_schedule = payload.get("schedule") or []
            schedule = [ScheduleItem(**item) for item in raw_schedule]
            return schedule, "openai"
        except Exception:
            return self._mock_schedule(date_str, tasks), "mock"

    @staticmethod
    def _mock_parse_task(text: str) -> ParsedTask:
        return ParsedTask(
            title=text[:80],
            description="Generated from natural language input",
            status=TaskStatus.todo,
            priority=TaskPriority.medium,
            due_date=None,
            estimated_minutes=45,
        )

    @staticmethod
    def _mock_breakdown(title: str) -> list[str]:
        return [
            f"Define the goal and acceptance criteria for {title}",
            "List dependencies and required resources",
            "Implement the core deliverable",
            "Review, test, and finalize the output",
        ]

    @staticmethod
    def _mock_schedule(date_str: str, tasks: list[Task]) -> list[ScheduleItem]:
        start = datetime.combine(datetime.fromisoformat(date_str).date(), time(hour=9, minute=0))
        schedule: list[ScheduleItem] = []

        sorted_tasks = sorted(
            tasks,
            key=lambda task: (
                0 if task.priority == TaskPriority.high else 1 if task.priority == TaskPriority.medium else 2,
                task.due_date or datetime.max,
            ),
        )

        for task in sorted_tasks[:6]:
            duration = task.estimated_minutes or 45
            end = start + timedelta(minutes=duration)
            schedule.append(
                ScheduleItem(
                    task_id=task.id,
                    title=task.title,
                    start_time=start.strftime("%H:%M"),
                    end_time=end.strftime("%H:%M"),
                )
            )
            start = end + timedelta(minutes=10)

        return schedule


ai_service = AIService()
