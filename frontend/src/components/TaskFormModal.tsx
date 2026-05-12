import { useEffect, useState } from 'react';
import type { Project, Task, TaskPriority, TaskStatus } from '../types';

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: Partial<Task>) => Promise<void>;
  projects: Project[];
  initial?: Task | null;
}

const initialState: Partial<Task> = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  due_date: '',
  estimated_minutes: 30,
  project_id: undefined
};

export function TaskFormModal({ open, onClose, onSubmit, projects, initial }: TaskFormModalProps) {
  const [form, setForm] = useState<Partial<Task>>(initialState);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      const normalizedStatus = initial.status === 'done' ? 'in_progress' : initial.status;
      setForm({
        ...initial,
        status: normalizedStatus,
        due_date: initial.due_date ? initial.due_date.slice(0, 16) : ''
      });
    } else {
      setForm(initialState);
    }
  }, [initial, open]);

  if (!open) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    await onSubmit({
      ...form,
      due_date: form.due_date ? new Date(form.due_date as string).toISOString() : null,
      estimated_minutes: form.estimated_minutes ? Number(form.estimated_minutes) : null,
      project_id: form.project_id ? Number(form.project_id) : null
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
      <form onSubmit={submit} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-soft">
        <h3 className="text-xl font-bold text-slate-900">{initial ? 'Edit Task' : 'Create Task'}</h3>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            required
            value={form.title as string}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Task title"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500 md:col-span-2"
          />
          <textarea
            value={(form.description as string) || ''}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Description"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500 md:col-span-2"
            rows={3}
          />

          <select
            value={form.status as TaskStatus}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as TaskStatus }))}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500"
          >
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
          </select>

          <select
            value={form.priority as TaskPriority}
            onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value as TaskPriority }))}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <input
            type="datetime-local"
            value={(form.due_date as string) || ''}
            onChange={(event) => setForm((prev) => ({ ...prev, due_date: event.target.value }))}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500"
          />

          <input
            type="number"
            min={5}
            value={form.estimated_minutes || 30}
            onChange={(event) => setForm((prev) => ({ ...prev, estimated_minutes: Number(event.target.value) }))}
            placeholder="Estimated minutes"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500"
          />

          <select
            value={form.project_id || ''}
            onChange={(event) => setForm((prev) => ({ ...prev, project_id: Number(event.target.value) || undefined }))}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500 md:col-span-2"
          >
            <option value="">No project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : initial ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </div>
  );
}
