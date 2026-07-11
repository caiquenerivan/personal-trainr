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
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="min-h-screen overflow-x-hidden px-5 py-6 sm:px-8 lg:px-10 md:ml-64">
        <Header
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          user={user}
        />
        <Outlet />
      </main>
    </div>
  );
}
