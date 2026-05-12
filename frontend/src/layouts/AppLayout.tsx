import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="relative min-h-screen overflow-x-hidden tf-grid-overlay">
      <div className="tf-orb absolute -left-16 top-10 h-48 w-48 rounded-full bg-emerald-300/70" />
      <div className="tf-orb tf-orb-delay absolute -right-16 top-24 h-56 w-56 rounded-full bg-cyan-300/70" />
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <main className="relative w-full">
        <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
          <TopBar onMenuClick={() => setOpen(true)} />
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="mt-6"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
