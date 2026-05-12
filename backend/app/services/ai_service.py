import json
import re
from datetime import datetime, time, timedelta
from math import ceil
from typing import Any

import httpx
from openai import OpenAI

from app.core.config import get_settings
from app.models.enums import TaskPriority, TaskStatus
from app.models.task import Task
from app.schemas.ai import ParsedTask, ScheduleItem

settings = get_settings()


class AIService:
    def __init__(self) -> None:
        self.openai_client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    def parse_task(self, text: str) -> tuple[ParsedTask, str]:
        provider = self._provider()

        if provider == "openai" and self.openai_client:
            try:
                payload = self._openai_parse_task(text)
                return self._build_parsed_task(payload, text), "openai"
            except Exception:
                pass

        if provider == "ollama":
            try:
                payload = self._ollama_parse_task(text)
                return self._build_parsed_task(payload, text), "ollama"
            except Exception:
                pass

        return self._mock_parse_task(text), "mock"

    def breakdown_task(self, title: str, description: str | None) -> tuple[list[str], str]:
        provider = self._provider()

        if provider == "openai" and self.openai_client:
            try:
                subtasks = self._openai_breakdown_task(title, description)
                return subtasks, "openai"
            except Exception:
                pass

        if provider == "ollama":
            try:
                subtasks = self._ollama_breakdown_task(title, description)
                return subtasks, "ollama"
            except Exception:
                pass

        return self._mock_breakdown(title), "mock"

    def generate_schedule(self, date_str: str, tasks: list[Task]) -> tuple[list[ScheduleItem], str]:
        if not tasks:
            return [], "mock"

        provider = self._provider()

        if provider == "openai" and self.openai_client:
            try:
                schedule = self._openai_generate_schedule(date_str, tasks)
                return schedule, "openai"
            except Exception:
                pass

        if provider == "ollama":
            try:
                schedule = self._ollama_generate_schedule(date_str, tasks)
                return schedule, "ollama"
            except Exception:
                pass

        return self._mock_schedule(date_str, tasks), "mock"

    @staticmethod
    def _provider() -> str:
        return (settings.ai_provider or "mock").strip().lower()

    def _openai_parse_task(self, text: str) -> dict[str, Any]:
        system_prompt = (
            "You convert natural language tasks into JSON with keys: title, description, "
            "status(todo|in_progress|done), priority(low|medium|high), due_date(ISO8601|null), estimated_minutes(int|null)."
        )

        response = self.openai_client.chat.completions.create(
            model=settings.openai_model,
            temperature=0.2,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text},
            ],
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content or "{}")

    def _openai_breakdown_task(self, title: str, description: str | None) -> list[str]:
        prompt = (
            "Break this task into 4-8 concrete subtasks. Return JSON with a `subtasks` array of short strings.\n\n"
            f"Title: {title}\nDescription: {description or ''}"
        )

        response = self.openai_client.chat.completions.create(
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
        return [str(item) for item in subtasks]

    def _openai_generate_schedule(self, date_str: str, tasks: list[Task]) -> list[ScheduleItem]:
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

        response = self.openai_client.chat.completions.create(
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
        return [ScheduleItem(**item) for item in raw_schedule]

    def _ollama_parse_task(self, text: str) -> dict[str, Any]:
        prompt = (
            "Return JSON only with keys: title, description, status(todo|in_progress|done), "
            "priority(low|medium|high), due_date(ISO8601|null), estimated_minutes(int|null).\n\n"
            f"Input: {text}"
        )
        return self._ollama_json(prompt)

    def _ollama_breakdown_task(self, title: str, description: str | None) -> list[str]:
        prompt = (
            "Return JSON only with key `subtasks` as array of 4-8 short strings.\n\n"
            f"Title: {title}\nDescription: {description or ''}"
        )
        payload = self._ollama_json(prompt)
        subtasks = payload.get("subtasks") or self._mock_breakdown(title)
        return [str(item) for item in subtasks]

    def _ollama_generate_schedule(self, date_str: str, tasks: list[Task]) -> list[ScheduleItem]:
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
            "Return JSON only with key `schedule` as array where each item has task_id, title, start_time(HH:MM), "
            f"end_time(HH:MM). Build for date {date_str}. Tasks: {json.dumps(task_payload)}"
        )
        payload = self._ollama_json(prompt)
        raw_schedule = payload.get("schedule") or []
        return [ScheduleItem(**item) for item in raw_schedule]

    def _ollama_json(self, prompt: str) -> dict[str, Any]:
        endpoint = f"{settings.ollama_base_url.rstrip('/')}/api/chat"
        body = {
            "model": settings.ollama_model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            "format": "json",
        }

        response = httpx.post(endpoint, json=body, timeout=60)
        response.raise_for_status()
        content = response.json().get("message", {}).get("content", "{}")
        return json.loads(content)

    @staticmethod
    def _build_parsed_task(payload: dict[str, Any], fallback_text: str) -> ParsedTask:
        return ParsedTask(
            title=payload.get("title") or fallback_text[:80] or "Untitled Task",
            description=payload.get("description"),
            status=payload.get("status", TaskStatus.todo),
            priority=payload.get("priority", TaskPriority.medium),
            due_date=payload.get("due_date"),
            estimated_minutes=payload.get("estimated_minutes"),
        )

    @staticmethod
    def _mock_parse_task(text: str) -> ParsedTask:
        normalized = " ".join(text.strip().split())
        lowered = normalized.lower()

        due_date = AIService._extract_due_date(normalized)
        status = AIService._infer_status(lowered)
        title = AIService._extract_title(normalized)
        estimated_minutes = AIService._extract_estimated_minutes(lowered)
        if estimated_minutes is None:
            estimated_minutes = AIService._default_minutes_for_intent(lowered)

        estimated_minutes = max(5, min(estimated_minutes, 24 * 60))
        priority = AIService._infer_priority(lowered, due_date)

        due_hint = due_date.strftime("%a %b %d, %I:%M %p UTC") if due_date else "no explicit due time detected"
        description = (
            f"Smart mock parse from text input. Due hint: {due_hint}. "
            f"Estimated effort: {estimated_minutes} minutes."
        )

        return ParsedTask(
            title=title[:180],
            description=description[:500],
            status=status,
            priority=priority,
            due_date=due_date,
            estimated_minutes=estimated_minutes,
        )

    @staticmethod
    def _mock_breakdown(title: str) -> list[str]:
        task = title.strip() or "this task"
        lowered = task.lower()
        intent = AIService._detect_intent(lowered)

        templates: dict[str, list[str]] = {
            "coding": [
                "Confirm requirements and acceptance criteria",
                "Set up or validate local dev/test environment",
                "Implement core logic in a small, testable slice",
                "Add or update tests for edge cases and regressions",
                "Refactor naming/comments and verify final behavior",
            ],
            "writing": [
                "Outline key sections and define target audience",
                "Gather references, facts, or examples",
                "Draft the first full version without editing",
                "Edit for clarity, flow, and conciseness",
                "Finalize formatting and publish/share",
            ],
            "study": [
                "Define the exact topic and learning goal",
                "Collect best resources and prioritize one primary source",
                "Complete focused study block and take notes",
                "Practice with problems/questions from memory",
                "Summarize key takeaways and plan next review",
            ],
            "meeting": [
                "Set meeting objective and desired outcomes",
                "Prepare agenda and required pre-read materials",
                "List decisions needed and stakeholders to involve",
                "Run meeting, capture decisions and action items",
                "Send follow-up summary with owners and deadlines",
            ],
            "shopping": [
                "Define exact items/specifications and budget",
                "Shortlist options from 2-3 reliable sources",
                "Compare price, quality, and delivery timelines",
                "Complete purchase and save confirmation details",
                "Verify delivery/fit and close the task",
            ],
            "research": [
                "Define the question and success criteria",
                "Gather sources and capture key observations",
                "Synthesize patterns, tradeoffs, and constraints",
                "Draft recommendation with rationale",
                "Review assumptions and finalize decision",
            ],
            "generic": [
                "Clarify the expected outcome and definition of done",
                "Break work into 2-4 milestones with rough timing",
                "Execute the first high-impact milestone",
                "Resolve blockers and complete remaining milestones",
                "Review quality and finalize deliverable",
            ],
        }

        base = templates.get(intent, templates["generic"])
        return [f"{step} for: {task}" if "for:" not in step else step for step in base]

    @staticmethod
    def _mock_schedule(date_str: str, tasks: list[Task]) -> list[ScheduleItem]:
        day = datetime.fromisoformat(date_str).date()
        now = datetime.utcnow()
        current = datetime.combine(day, time(hour=9, minute=0))
        day_end = datetime.combine(day, time(hour=18, minute=0))
        lunch_start = datetime.combine(day, time(hour=12, minute=30))
        lunch_end = datetime.combine(day, time(hour=13, minute=15))

        schedule: list[ScheduleItem] = []
        ranked = sorted(tasks, key=lambda item: AIService._task_score(item, now), reverse=True)

        for task in ranked[:10]:
            if current >= day_end:
                break

            if lunch_start <= current < lunch_end:
                current = lunch_end

            title_lower = (task.title or "").lower()
            total_minutes = task.estimated_minutes or AIService._default_minutes_for_intent(title_lower)
            total_minutes = max(25, min(total_minutes, 4 * 60))
            deep_work = AIService._detect_intent(title_lower) in {"coding", "research", "writing", "study"}
            max_chunk = 90 if deep_work else 60
            chunks = ceil(total_minutes / max_chunk)
            remaining = total_minutes

            for index in range(chunks):
                if current >= day_end:
                    break

                if lunch_start <= current < lunch_end:
                    current = lunch_end

                chunk = min(max_chunk, remaining)
                chunk = max(25, int(round(chunk / 5) * 5))
                end = current + timedelta(minutes=chunk)

                if current < lunch_start < end:
                    end = lunch_start
                    chunk = int((end - current).total_seconds() // 60)
                if chunk < 25:
                    current = lunch_end if current < lunch_end else current + timedelta(minutes=10)
                    continue

                label = task.title if chunks == 1 else f"{task.title} (Part {index + 1}/{chunks})"
                schedule.append(
                    ScheduleItem(
                        task_id=task.id,
                        title=label,
                        start_time=current.strftime("%H:%M"),
                        end_time=end.strftime("%H:%M"),
                    )
                )

                current = end
                remaining -= chunk

                if remaining > 0:
                    current += timedelta(minutes=10)

            if current < day_end:
                current += timedelta(minutes=5)

        if schedule and current + timedelta(minutes=30) <= day_end:
            schedule.append(
                ScheduleItem(
                    task_id=None,
                    title="Daily wrap-up: review progress and plan tomorrow",
                    start_time=current.strftime("%H:%M"),
                    end_time=(current + timedelta(minutes=30)).strftime("%H:%M"),
                )
            )

        return schedule

    @staticmethod
    def _infer_status(text: str) -> TaskStatus:
        if any(word in text for word in ["done", "completed", "finished", "already did"]):
            return TaskStatus.done
        if any(word in text for word in ["continue", "resume", "in progress", "ongoing"]):
            return TaskStatus.in_progress
        return TaskStatus.todo

    @staticmethod
    def _infer_priority(text: str, due_date: datetime | None) -> TaskPriority:
        high_keywords = ["urgent", "asap", "critical", "important", "high priority", "immediately"]
        low_keywords = ["later", "optional", "low priority", "someday", "whenever"]
        now = datetime.utcnow()

        if any(word in text for word in high_keywords):
            return TaskPriority.high
        if any(word in text for word in low_keywords):
            return TaskPriority.low

        if due_date:
            hours_left = (due_date - now).total_seconds() / 3600
            if hours_left <= 24:
                return TaskPriority.high
            if hours_left <= 72:
                return TaskPriority.medium

        return TaskPriority.medium

    @staticmethod
    def _extract_estimated_minutes(text: str) -> int | None:
        hour_minute = re.search(r"(\d+)\s*h(?:our|r)?s?(?:\s*(\d+)\s*m(?:in)?s?)?", text)
        if hour_minute:
            hours = int(hour_minute.group(1))
            minutes = int(hour_minute.group(2) or 0)
            return hours * 60 + minutes

        minute_only = re.search(r"(\d+)\s*m(?:in|inute)?s?", text)
        if minute_only:
            return int(minute_only.group(1))

        if "half day" in text:
            return 4 * 60
        if "full day" in text:
            return 8 * 60
        if any(word in text for word in ["quick", "small fix", "tiny"]):
            return 20

        return None

    @staticmethod
    def _default_minutes_for_intent(text: str) -> int:
        intent = AIService._detect_intent(text)
        defaults = {
            "coding": 120,
            "writing": 75,
            "study": 90,
            "meeting": 45,
            "shopping": 45,
            "research": 90,
            "generic": 60,
        }
        return defaults.get(intent, 60)

    @staticmethod
    def _extract_title(text: str) -> str:
        trimmed = text.strip().rstrip(".")
        trimmed = re.sub(
            r"^(please\s+|can you\s+|could you\s+|help me\s+|i need to\s+|need to\s+|todo:\s*)",
            "",
            trimmed,
            flags=re.IGNORECASE,
        )
        candidate = trimmed

        # Remove leading temporal phrases like "tomorrow morning, ..."
        candidate = re.sub(
            r"^(today|tomorrow|tonight|this week|next week|on\s+\w+day|in\s+\d+\s+days?)"
            r"(?:\s+(morning|afternoon|evening|noon|eod|end of day))?[:,]?\s*",
            "",
            candidate,
            flags=re.IGNORECASE,
        )

        # Remove trailing due-time clauses like "... by Friday 5pm"
        candidate = re.sub(
            r"\s+\b(by|before|after)\b.*$",
            "",
            candidate,
            flags=re.IGNORECASE,
        )

        # Remove standalone effort suffix like "(2 hours)"
        candidate = re.sub(r"\s*\((\d+)\s*(h|hr|hour|hours|min|minutes?)\)\s*$", "", candidate, flags=re.IGNORECASE)
        candidate = candidate.strip(" ,.-")

        if not candidate:
            candidate = "Untitled Task"
        return candidate[:1].upper() + candidate[1:]

    @staticmethod
    def _extract_due_date(text: str) -> datetime | None:
        lowered = text.lower()
        now = datetime.utcnow()
        hour, minute = AIService._extract_time_hint(lowered)

        if "today" in lowered:
            return now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if "tonight" in lowered:
            return now.replace(hour=max(hour, 20), minute=minute, second=0, microsecond=0)
        if "tomorrow" in lowered:
            return (now + timedelta(days=1)).replace(hour=hour, minute=minute, second=0, microsecond=0)

        in_days_match = re.search(r"in\s+(\d+)\s+day", lowered)
        if in_days_match:
            days = int(in_days_match.group(1))
            return (now + timedelta(days=days)).replace(hour=hour, minute=minute, second=0, microsecond=0)

        weekday_map = {
            "monday": 0,
            "tuesday": 1,
            "wednesday": 2,
            "thursday": 3,
            "friday": 4,
            "saturday": 5,
            "sunday": 6,
        }
        for name, idx in weekday_map.items():
            if name in lowered:
                next_week = f"next {name}" in lowered
                return AIService._next_weekday(now, idx, next_week).replace(
                    hour=hour, minute=minute, second=0, microsecond=0
                )

        if "this week" in lowered:
            return AIService._next_weekday(now, 4, False).replace(
                hour=18, minute=0, second=0, microsecond=0
            )
        if "next week" in lowered:
            return (now + timedelta(days=7)).replace(hour=18, minute=0, second=0, microsecond=0)

        return None

    @staticmethod
    def _extract_time_hint(text: str) -> tuple[int, int]:
        explicit = re.search(r"\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b", text)
        if explicit:
            hour = int(explicit.group(1))
            minute = int(explicit.group(2) or 0)
            meridian = explicit.group(3)
            if meridian == "pm" and hour != 12:
                hour += 12
            if meridian == "am" and hour == 12:
                hour = 0
            return hour, minute

        military = re.search(r"\b(\d{1,2}):(\d{2})\b", text)
        if military:
            return int(military.group(1)), int(military.group(2))

        if "morning" in text:
            return 10, 0
        if "afternoon" in text:
            return 15, 0
        if "evening" in text or "tonight" in text:
            return 20, 0
        if "noon" in text:
            return 12, 0
        if "eod" in text or "end of day" in text:
            return 18, 0
        return 18, 0

    @staticmethod
    def _next_weekday(base: datetime, target_weekday: int, force_next_week: bool) -> datetime:
        delta = (target_weekday - base.weekday()) % 7
        if delta == 0:
            delta = 7
        if force_next_week:
            delta += 7
        return base + timedelta(days=delta)

    @staticmethod
    def _detect_intent(text: str) -> str:
        rules = {
            "coding": ["code", "bug", "api", "backend", "frontend", "feature", "deploy", "refactor", "fix"],
            "writing": ["write", "blog", "article", "post", "draft", "proposal", "document", "essay"],
            "study": ["study", "learn", "practice", "exam", "course", "read chapter", "revise"],
            "meeting": ["meeting", "call", "sync", "agenda", "1:1", "standup", "discussion"],
            "shopping": ["buy", "shopping", "order", "purchase", "cart", "groceries"],
            "research": ["research", "investigate", "analyze", "compare", "evaluate", "benchmark"],
        }
        for intent, keywords in rules.items():
            if any(keyword in text for keyword in keywords):
                return intent
        return "generic"

    @staticmethod
    def _task_score(task: Task, now: datetime) -> float:
        priority_weight = {
            TaskPriority.high: 120.0,
            TaskPriority.medium: 75.0,
            TaskPriority.low: 40.0,
        }.get(task.priority, 60.0)

        due_weight = 0.0
        if task.due_date:
            hours = (task.due_date - now).total_seconds() / 3600
            due_weight = max(-30.0, 60.0 - max(hours, 0) * 0.8)

        status_weight = 20.0 if task.status == TaskStatus.in_progress else 0.0
        effort_weight = -min(task.estimated_minutes or 60, 180) / 12
        return priority_weight + due_weight + status_weight + effort_weight


ai_service = AIService()
