import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { breakdownTask, generateSchedule, parseTask } from '../api/ai';
import { createTask } from '../api/tasks';
import type { ScheduleItem, Task } from '../types';

export function AIPlannerPage() {
  const queryClient = useQueryClient();
  const [naturalInput, setNaturalInput] = useState('Prepare architecture proposal by tomorrow noon with 2 hours focus');
  const [parsedTask, setParsedTask] = useState<Partial<Task> | null>(null);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [parseSource, setParseSource] = useState<string | null>(null);
  const [breakdownSource, setBreakdownSource] = useState<string | null>(null);
  const [scheduleSource, setScheduleSource] = useState<string | null>(null);

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const parseMutation = useMutation({
    mutationFn: parseTask,
    onSuccess: (data) => {
      setParsedTask(data.task);
      setParseSource(data.source);
      toast.success(`Task parsed via ${data.source}`);
    },
    onError: () => toast.error('Failed to parse input')
  });

  const breakdownMutation = useMutation({
    mutationFn: ({ title, description }: { title: string; description?: string }) => breakdownTask(title, description),
    onSuccess: (data) => {
      setSubtasks(data.subtasks);
      setBreakdownSource(data.source);
      toast.success(`Breakdown generated via ${data.source}`);
    },
    onError: () => toast.error('Failed to breakdown task')
  });

  const scheduleMutation = useMutation({
    mutationFn: generateSchedule,
    onSuccess: (data) => {
      setSchedule(data.schedule);
      setScheduleSource(data.source);
      toast.success(`Schedule generated via ${data.source}`);
    },
    onError: () => toast.error('Failed to generate schedule')
  });

  const saveTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      toast.success('Task added to Tasks list');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] });
    },
    onError: () => toast.error('Could not save parsed task')
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="tf-panel p-6">
        <h2 className="text-xl font-extrabold text-slate-900">Natural Language Planner</h2>
        {(parseSource === 'mock' || breakdownSource === 'mock' || scheduleSource === 'mock') && (
          <div className="mt-3 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-800">
            AI is currently in mock mode. For zero-cost real AI, use `AI_PROVIDER=ollama` with a local Ollama model.
          </div>
        )}
        <textarea
          value={naturalInput}
          onChange={(event) => setNaturalInput(event.target.value)}
          rows={5}
          className="mt-4 w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-sm outline-none focus:border-teal-500"
        />
        <button
          onClick={() => parseMutation.mutate(naturalInput)}
          disabled={parseMutation.isPending}
          className="tf-btn-primary mt-4 disabled:opacity-60"
        >
          {parseMutation.isPending ? 'Parsing...' : 'Parse into Task Fields'}
        </button>

        {parsedTask && (
          <div className="mt-6 rounded-xl border border-teal-200 bg-teal-50/70 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">{parsedTask.title}</p>
            <p className="mt-1">Priority: {parsedTask.priority}</p>
            <p>Status: {parsedTask.status}</p>
            <p>Estimated: {parsedTask.estimated_minutes || 0} minutes</p>
            {parseSource && <p className="mt-1 text-xs text-slate-500">Source: {parseSource}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  breakdownMutation.mutate({
                    title: parsedTask.title || naturalInput,
                    description: parsedTask.description || naturalInput
                  })
                }
                className="tf-btn-accent px-3 py-1.5 text-xs"
              >
                AI Breakdown Task
              </button>
              <button
                disabled={saveTaskMutation.isPending}
                onClick={() =>
                  saveTaskMutation.mutate({
                    title: parsedTask.title || naturalInput,
                    description: parsedTask.description || undefined,
                    status: parsedTask.status || 'todo',
                    priority: parsedTask.priority || 'medium',
                    estimated_minutes: parsedTask.estimated_minutes || 45,
                    due_date: parsedTask.due_date || null
                  })
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
              >
                {saveTaskMutation.isPending ? 'Saving...' : 'Add To Tasks'}
              </button>
            </div>
          </div>
        )}

        {!!subtasks.length && (
          <div className="tf-card mt-4 p-4">
            <h4 className="font-semibold text-slate-900">Suggested subtasks</h4>
            {breakdownSource && <p className="mb-2 text-xs text-slate-500">Source: {breakdownSource}</p>}
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
              {subtasks.map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <section className="tf-panel p-6">
        <h2 className="text-xl font-extrabold text-slate-900">Daily AI Schedule</h2>
        <p className="mt-1 text-sm text-slate-500">
          Generates timeline from your incomplete Tasks-page items for {today}
        </p>
        <button
          onClick={() => scheduleMutation.mutate(today)}
          disabled={scheduleMutation.isPending}
          className="tf-btn-warm mt-4 disabled:opacity-60"
        >
          {scheduleMutation.isPending ? 'Generating...' : 'Generate Schedule'}
        </button>

        <div className="mt-6 space-y-3">
          {scheduleSource && <p className="text-xs text-slate-500">Source: {scheduleSource}</p>}
          {schedule.map((slot) => (
            <div key={`${slot.title}-${slot.start_time}`} className="tf-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {slot.start_time} - {slot.end_time}
              </p>
              <p className="mt-1 font-semibold text-slate-900">{slot.title}</p>
            </div>
          ))}
          {!schedule.length && <p className="text-sm text-slate-500">No schedule generated yet.</p>}
        </div>
      </section>
    </div>
  );
}
