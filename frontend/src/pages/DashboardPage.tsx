import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAnalyticsSummary } from '../api/analytics';
import { listTasks } from '../api/tasks';
import { listNotifications } from '../api/notifications';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { StatCard } from '../components/StatCard';

export function DashboardPage() {
  const summaryQuery = useQuery({ queryKey: ['analytics-summary'], queryFn: getAnalyticsSummary });
  const tasksQuery = useQuery({ queryKey: ['tasks-recent'], queryFn: () => listTasks() });
  const notificationsQuery = useQuery({ queryKey: ['notifications-recent'], queryFn: listNotifications });

  if (summaryQuery.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <LoadingSkeleton className="h-36" />
        <LoadingSkeleton className="h-36" />
        <LoadingSkeleton className="h-36" />
      </div>
    );
  }

  const summary = summaryQuery.data;
  const recentTasks = tasksQuery.data?.slice(0, 5) || [];
  const unreadNotifications = notificationsQuery.data?.filter((item) => !item.is_read).length || 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Tasks" value={summary?.total_tasks ?? 0} hint="Tasks across all projects" />
        <StatCard title="Completed" value={summary?.completed_tasks ?? 0} hint="Finished execution count" />
        <StatCard title="Completion Rate" value={`${summary?.completion_rate ?? 0}%`} hint="Progress health signal" />
        <StatCard title="Unread Alerts" value={unreadNotifications} hint="Upcoming reminders" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Tasks</h2>
            <Link to="/tasks" className="text-sm font-semibold text-teal-600">
              Manage
            </Link>
          </div>
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <article key={task.id} className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{task.title}</p>
                <p className="text-xs text-slate-500">
                  {task.status.replace('_', ' ')} • {task.priority}
                </p>
              </article>
            ))}
            {!recentTasks.length && <p className="text-sm text-slate-500">No tasks yet. Create your first task.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-bold text-slate-900">Focus Suggestions</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>Block two uninterrupted deep-work windows today.</li>
            <li>Tackle high-priority tasks before noon for faster completion.</li>
            <li>Review AI planner recommendations after adding new tasks.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
