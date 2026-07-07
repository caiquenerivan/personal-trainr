import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { StudentSidebar } from '../components/StudentSidebar';
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

export function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = getStoredUser();

  return (
    <div className="min-h-screen bg-panel font-body text-text-primary">
      <a
        href="#main-content"
        className="fixed -top-40 left-0 z-[100] rounded-br-lg bg-accent px-4 py-2 text-sm font-bold uppercase text-black transition-all focus:top-0"
      >
        Pular para conteúdo
      </a>
      <div className="flex min-h-screen">
        <StudentSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main
          id="main-content"
          className="min-w-0 flex-1 overflow-x-hidden px-5 py-6 sm:px-8 lg:px-10 md:ml-64"
        >
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
