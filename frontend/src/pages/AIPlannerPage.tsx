import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { breakdownTask, generateSchedule, parseTask } from '../api/ai';
import type { ScheduleItem, Task } from '../types';

export function AIPlannerPage() {
  const [naturalInput, setNaturalInput] = useState('Prepare architecture proposal by tomorrow noon with 2 hours focus');
  const [parsedTask, setParsedTask] = useState<Partial<Task> | null>(null);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const parseMutation = useMutation({
    mutationFn: parseTask,
    onSuccess: (data) => {
      setParsedTask(data.task);
      toast.success(`Task parsed via ${data.source}`);
    },
    onError: () => toast.error('Failed to parse input')
  });

  const breakdownMutation = useMutation({
    mutationFn: ({ title, description }: { title: string; description?: string }) => breakdownTask(title, description),
    onSuccess: (data) => {
      setSubtasks(data.subtasks);
      toast.success(`Breakdown generated via ${data.source}`);
    },
    onError: () => toast.error('Failed to breakdown task')
  });

  const scheduleMutation = useMutation({
    mutationFn: generateSchedule,
    onSuccess: (data) => {
      setSchedule(data.schedule);
      toast.success(`Schedule generated via ${data.source}`);
    },
    onError: () => toast.error('Failed to generate schedule')
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-bold text-slate-900">Natural Language Planner</h2>
        <textarea
          value={naturalInput}
          onChange={(event) => setNaturalInput(event.target.value)}
          rows={5}
          className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500"
        />
        <button
          onClick={() => parseMutation.mutate(naturalInput)}
          disabled={parseMutation.isPending}
          className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {parseMutation.isPending ? 'Parsing...' : 'Parse into Task Fields'}
        </button>

        {parsedTask && (
          <div className="mt-6 rounded-xl border border-teal-100 bg-teal-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">{parsedTask.title}</p>
            <p className="mt-1">Priority: {parsedTask.priority}</p>
            <p>Status: {parsedTask.status}</p>
            <p>Estimated: {parsedTask.estimated_minutes || 0} minutes</p>
            <button
              onClick={() =>
                breakdownMutation.mutate({
                  title: parsedTask.title || naturalInput,
                  description: parsedTask.description || naturalInput
                })
              }
              className="mt-3 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              AI Breakdown Task
            </button>
          </div>
        )}

        {!!subtasks.length && (
          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <h4 className="font-semibold text-slate-900">Suggested subtasks</h4>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
              {subtasks.map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-bold text-slate-900">Daily AI Schedule</h2>
        <p className="mt-1 text-sm text-slate-500">Generate timeline for {today}</p>
        <button
          onClick={() => scheduleMutation.mutate(today)}
          disabled={scheduleMutation.isPending}
          className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {scheduleMutation.isPending ? 'Generating...' : 'Generate Schedule'}
        </button>

        <div className="mt-6 space-y-3">
          {schedule.map((slot) => (
            <div key={`${slot.title}-${slot.start_time}`} className="rounded-xl border border-slate-200 p-4">
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
