import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import type { UserData } from '../api/auth';

function getStoredUser(): UserData | null {
  try {
    const raw = window.localStorage.getItem('personaltrainr.user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = getStoredUser();

  return (
    <div className="min-h-screen bg-panel font-body text-text-primary">
      <div className="flex min-h-screen">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="min-w-0 flex-1 overflow-x-hidden px-5 py-6 sm:px-8 lg:px-10">
          <Header
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
            user={user}
          />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
