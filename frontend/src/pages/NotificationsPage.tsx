import { formatDistanceToNow } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listNotifications, markNotificationRead } from '../api/notifications';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({ queryKey: ['notifications'], queryFn: listNotifications });

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Marked as read');
    },
    onError: () => toast.error('Could not update notification')
  });

  if (notificationsQuery.isLoading) {
    return <LoadingSkeleton className="h-40" />;
  }

  const notifications = notificationsQuery.data || [];

  return (
    <section className="space-y-4">
      {notifications.map((notification) => (
        <article
          key={notification.id}
          className={`rounded-2xl border p-5 shadow-soft ${
            notification.is_read ? 'border-slate-200 bg-white' : 'border-teal-200 bg-teal-50/50'
          }`}
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">{notification.title}</h3>
              <p className="text-sm text-slate-600">{notification.message}</p>
              <p className="mt-1 text-xs text-slate-500">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
            </div>
            {!notification.is_read && (
              <button
                onClick={() => readMutation.mutate(notification.id)}
                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
              >
                Mark read
              </button>
            )}
          </div>
        </article>
      ))}

      {!notifications.length && <EmptyState title="No notifications" subtitle="Reminders for due tasks will appear here." />}
    </section>
  );
}
