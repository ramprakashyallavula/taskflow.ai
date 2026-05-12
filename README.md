# TaskFlow AI

TaskFlow AI is a full-stack SaaS productivity platform that combines classic task management with AI-assisted planning.

## Project Overview
TaskFlow AI helps users capture work, organize by projects and priority, and execute with AI-generated plans.

### Core Features
- JWT auth with register/login/me
- Task CRUD with status, priority, due date, project mapping, search and filters
- Project CRUD and task assignment
- AI routes:
  - parse natural language into structured task fields
  - break tasks into subtasks
  - generate a daily schedule from incomplete tasks
- Notification records + scheduled due-task reminders
- Productivity analytics (completion rate, overdue, status and priority breakdown)
- Modern dashboard frontend with protected routes, smooth cards/modals, loading states, and charts

## Tech Stack
- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL, Pydantic, JWT, bcrypt, APScheduler, OpenAI SDK, pytest
- Frontend: React + TypeScript + Vite, Tailwind CSS, React Router, Axios, TanStack Query, Recharts, Framer Motion
- DevOps: Docker, docker-compose, GitHub Actions CI

## Architecture

### Backend
- `backend/app/main.py` - app bootstrap, CORS, router registration, scheduler lifecycle
- `backend/app/models/` - SQLAlchemy models (`User`, `Task`, `Project`, `Notification`)
- `backend/app/routes/` - domain endpoints (auth, users, tasks, projects, ai, analytics, notifications)
- `backend/app/services/` - AI orchestration, analytics aggregation, reminder generation
- `backend/alembic/` - migration setup + initial schema
- `backend/tests/` - auth/task API tests

### Frontend
- `frontend/src/pages/` - landing/auth/dashboard/tasks/projects/AI/analytics/notifications pages
- `frontend/src/components/` - reusable layout and UI pieces
- `frontend/src/api/` - Axios client + typed API modules
- `frontend/src/context/` - auth state management

## Folder Structure

```text
taskflow-ai/
├── backend/
├── frontend/
├── docker-compose.yml
└── README.md
```

## Local Setup

### 1) Clone and enter
```bash
git clone <your-repo-url>
cd taskflow-ai
```

If your parent folder path contains spaces (for example `New project`), always quote it:
```bash
cd "/Users/ramprakashyallavula/Documents/New project/taskflow-ai"
```

### 2) Backend setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Update `.env` values (`DATABASE_URL`, `SECRET_KEY`, optional `OPENAI_API_KEY`).

Cost-free AI modes:
- `AI_PROVIDER=mock` (default, no external API usage)
- `AI_PROVIDER=ollama` (free local LLM on your machine)

Run migrations:
```bash
alembic upgrade head
```

Run API:
```bash
uvicorn app.main:app --reload
```

### Optional: Free Local AI With Ollama
1. Install Ollama from [https://ollama.com](https://ollama.com)
2. Pull a model:
```bash
ollama pull llama3.1:8b
```
3. Set in `backend/.env`:
```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=llama3.1:8b
```
4. Restart backend (or Docker stack).

### 3) Frontend setup
```bash
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

Frontend default: `http://localhost:5173`  
Backend default: `http://localhost:8000`

## Run With Docker

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

Services:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Postgres: `localhost:5433`

## Troubleshooting

### `zsh: no such file or directory .../New`
This happens when your path contains spaces and the command is unquoted.

Use:
```bash
cd "/Users/ramprakashyallavula/Documents/New project/taskflow-ai"
```

### Docker port conflict on `5432`
If local Postgres is already using `5432`, this project maps Docker Postgres to host `5433`.

## API Examples

### Register
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@taskflow.ai","full_name":"Demo User","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@taskflow.ai","password":"password123"}'
```

### Create Task
```bash
curl -X POST http://localhost:8000/api/v1/tasks \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Prepare sprint review","priority":"high","status":"todo"}'
```

### Generate Schedule
```bash
curl -X POST http://localhost:8000/api/v1/ai/generate-schedule \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-05-11"}'
```

## Testing

### Backend tests
```bash
cd backend
pytest
```

## CI
GitHub Actions workflow (`.github/workflows/ci.yml`) runs:
- backend pytest suite
- frontend production build

## Cloud Deployment (Render Blueprint)

This repo includes [`render.yaml`](./render.yaml) for one-click infrastructure on Render:
- `taskflow-db` (Postgres)
- `taskflow-api` (Docker web service)
- `taskflow-web` (static frontend with SPA rewrite)

### Deploy steps
1. In Render dashboard, choose **New > Blueprint**.
2. Connect your GitHub repo `ramprakashyallavula/taskflow.ai`.
3. Apply the Blueprint from `render.yaml`.
4. Set Blueprint prompts:
   - `VITE_API_BASE_URL`: `https://<your-taskflow-api>.onrender.com/api/v1`
   - `CORS_ORIGINS`: `https://<your-taskflow-web>.onrender.com,http://localhost:5173`
   - `OPENAI_API_KEY`: optional (app still works with mock AI responses if blank)

## Resume Bullets (Ready to Use)
- Built **TaskFlow AI**, a full-stack productivity SaaS using FastAPI, PostgreSQL, React, and TypeScript with secure JWT auth and user-scoped CRUD APIs.
- Integrated AI planning workflows (task parsing, subtask generation, daily schedule generation) with OpenAI API and graceful mock fallback for local/dev reliability.
- Designed analytics and reminder systems with scheduled background jobs, interactive Recharts dashboards, and end-to-end Dockerized local deployment + CI automation.

## Interview Demo Flow
1. Register/login and show protected route behavior.
2. Create projects and tasks with filter/search/edit/delete.
3. Run AI planner parse + breakdown + schedule.
4. Open analytics to discuss completion/overdue/priority metrics.
5. Show notifications reminders and mark-read flow.
6. Explain architecture choices, mock fallback strategy, and CI/Docker setup.
