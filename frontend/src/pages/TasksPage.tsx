import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createTask, deleteTask, listTasks, updateTask } from '../api/tasks';
import { listProjects } from '../api/projects';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { TaskFormModal } from '../components/TaskFormModal';
import type { Task, TaskPriority, TaskStatus } from '../types';

export function TasksPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [openModal, setOpenModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const tasksQuery = useQuery({ queryKey: ['tasks'], queryFn: () => listTasks() });
  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: listProjects });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      toast.success('Task created');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] });
    },
    onError: () => toast.error('Failed to create task')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Task> }) => updateTask(id, payload),
    onSuccess: () => {
      toast.success('Task updated');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] });
    },
    onError: () => toast.error('Failed to update task')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      toast.success('Task deleted');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] });
    },
    onError: () => toast.error('Failed to delete task')
  });

  const filteredTasks = useMemo(() => {
    const tasks = tasksQuery.data || [];
    return tasks.filter((task) => {
      const matchesSearch = !search || task.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || task.status === statusFilter;
      const matchesPriority = !priorityFilter || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasksQuery.data, search, statusFilter, priorityFilter]);

  if (tasksQuery.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <LoadingSkeleton className="h-40" />
        <LoadingSkeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks"
              className="w-full border-none bg-transparent text-sm outline-none"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as TaskStatus | '')}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">All status</option>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as TaskPriority | '')}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button
              onClick={() => {
                setEditingTask(null);
                setOpenModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus size={16} /> New task
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredTasks.map((task) => (
          <article key={task.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{task.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{task.description || 'No description provided.'}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{task.priority}</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">Status: {task.status.replace('_', ' ')}</p>
            <p className="text-xs text-slate-500">Est: {task.estimated_minutes || 0} mins</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setEditingTask(task);
                  setOpenModal(true);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                onClick={() => deleteMutation.mutate(task.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {!filteredTasks.length && (
        <EmptyState title="No tasks found" subtitle="Try changing filters, or create your first task." />
      )}

      <TaskFormModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        projects={projectsQuery.data || []}
        initial={editingTask}
        onSubmit={async (payload) => {
          if (editingTask) {
            await updateMutation.mutateAsync({ id: editingTask.id, payload });
          } else {
            await createMutation.mutateAsync(payload);
          }
        }}
      />
    </div>
  );
}
