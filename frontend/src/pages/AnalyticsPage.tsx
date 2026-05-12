import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { getAnalyticsSummary } from '../api/analytics';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { StatCard } from '../components/StatCard';

export function AnalyticsPage() {
  const analyticsQuery = useQuery({ queryKey: ['analytics-summary'], queryFn: getAnalyticsSummary });

  if (analyticsQuery.isLoading) {
    return <LoadingSkeleton className="h-80" />;
  }

  const summary = analyticsQuery.data;
  if (!summary) return null;

  const statusData = Object.entries(summary.tasks_by_status).map(([key, value]) => ({ name: key, value }));
  const priorityData = Object.entries(summary.tasks_by_priority).map(([key, value]) => ({ name: key, value }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Tasks" value={summary.total_tasks} hint="Across the workspace" />
        <StatCard title="Completed" value={summary.completed_tasks} hint="Execution throughput" />
        <StatCard title="Overdue" value={summary.overdue_tasks} hint="Needs immediate action" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="tf-panel p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Tasks by Status</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(15,23,42,0.12)' }} />
                <Legend />
                <Bar dataKey="value" fill="#0ea5a4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="tf-panel p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Priority Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={priorityData} dataKey="value" nameKey="name" outerRadius={110} fill="#f97316" label />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(15,23,42,0.12)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
