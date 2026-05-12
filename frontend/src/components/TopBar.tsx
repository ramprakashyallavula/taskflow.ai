import { Menu } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 backdrop-blur">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Focus Session</p>
        <p className="text-lg font-semibold text-slate-900">Welcome back, {user?.full_name?.split(' ')[0]}</p>
      </div>
      <div className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-soft">
        Today matters
      </div>
    </header>
  );
}
