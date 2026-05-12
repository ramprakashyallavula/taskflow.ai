import { Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-3 z-20 tf-panel px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-xl border border-slate-300 bg-white/60 p-2 text-slate-600 hover:bg-white"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div>
            <p className="tf-label">Focus Session</p>
            <p className="text-lg font-extrabold text-slate-900 sm:text-2xl">Welcome back, {user?.full_name?.split(' ')[0]}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/tasks?focus=meaningful-win')}
          className="hidden rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-100 sm:inline-flex"
          title="Jump to your top-priority unfinished task"
        >
          Ship one meaningful win
        </button>
      </div>
      <button
        type="button"
        onClick={() => navigate('/tasks?focus=meaningful-win')}
        className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100 sm:hidden"
        title="Jump to your top-priority unfinished task"
      >
        Ship one meaningful win
      </button>
    </header>
  );
}
