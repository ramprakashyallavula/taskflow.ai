export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Project {
  id: number;
  user_id: number;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  user_id: number;
  project_id?: number | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null;
  estimated_minutes?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  task_id?: number | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AnalyticsSummary {
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  tasks_by_priority: Record<string, number>;
  tasks_by_status: Record<string, number>;
}

export interface ScheduleItem {
  task_id?: number | null;
  title: string;
  start_time: string;
  end_time: string;
}
