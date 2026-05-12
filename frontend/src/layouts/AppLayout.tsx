import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';

export function AppLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-base">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <TopBar onMenuClick={() => setOpen(true)} />
          <div className="mt-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
