import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../components/AdminSidebar';
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

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = getStoredUser();

  return (
    <div className="min-h-screen bg-panel font-body text-text-primary">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <main className="min-h-screen overflow-x-hidden px-5 py-6 sm:px-8 lg:px-10 md:ml-64">
        <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <Outlet />
      </main>
    </div>
  );
}
