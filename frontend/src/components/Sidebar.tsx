import { LayoutDashboard, Sparkles, Bell, BarChart3, FolderKanban, ListChecks, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const links = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Tasks', to: '/tasks', icon: ListChecks },
  { label: 'Projects', to: '/projects', icon: FolderKanban },
  { label: 'AI Planner', to: '/ai-planner', icon: Sparkles },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
  { label: 'Notifications', to: '/notifications', icon: Bell }
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { logout } = useAuth();

  return (
    <>
      {open && <button className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={onClose} aria-label="Close menu" />}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-72 flex-col border-r border-slate-200 bg-white/95 p-5 backdrop-blur transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-600">TaskFlow AI</p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Plan Deep Work</h1>
        </div>

        <nav className="mt-8 flex-1 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>
    </>
  );
}
