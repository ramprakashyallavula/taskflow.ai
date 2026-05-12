import { LayoutDashboard, Sparkles, Bell, BarChart3, FolderKanban, ListChecks, LogOut, X } from 'lucide-react';
import { motion } from 'framer-motion';
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
      {open && <button className="fixed inset-0 z-30 bg-slate-950/40" onClick={onClose} aria-label="Close menu" />}
      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="fixed left-0 top-0 z-40 flex h-full w-[86vw] max-w-sm flex-col border-r p-4 backdrop-blur-lg sm:p-5"
        style={{
          borderColor: 'rgba(15, 23, 42, 0.1)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(247,250,252,0.82) 100%)'
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="tf-label text-teal-700">TaskFlow AI</p>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">Plan Deep Work</h1>
            <p className="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Workspace Active
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white/70 p-2 text-slate-600 transition hover:bg-white"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="mt-6 flex-1 space-y-2 overflow-y-auto pr-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-900 shadow-sm'
                      : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
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
          className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
        >
          <LogOut size={16} />
          Logout
        </button>
      </motion.aside>
    </>
  );
}
