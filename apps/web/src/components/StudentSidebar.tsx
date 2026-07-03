import { NavLink, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, Play, User, LogOut, X } from 'lucide-react';

const menuItems = [
  { label: 'Meu Treino', to: '/aluno/painel', icon: Home },
  { label: 'Treinos', to: '/aluno/treinos', icon: ClipboardList },
  { label: 'Treino Hoje', to: '/aluno/treino-hoje', icon: Play },
  { label: 'Perfil', to: '/aluno/perfil', icon: User },
];

type StudentSidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export function StudentSidebar({ isOpen, onClose }: StudentSidebarProps) {
  const navigate = useNavigate();

  function handleLogout() {
    window.localStorage.removeItem('personaltrainr.token');
    window.localStorage.removeItem('personaltrainr.user');
    onClose?.();
    navigate('/login', { replace: true });
  }

  function handleNavClick() {
    onClose?.();
  }

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between mb-10 border-b border-border pb-6">
        <p className="font-title text-2xl uppercase text-accent">Personal Trainr</p>
        <button onClick={onClose} className="flex items-center justify-center text-text-secondary hover:text-accent md:hidden min-h-[44px] min-w-[44px]">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 font-body text-sm uppercase transition ${
                isActive
                  ? 'bg-base text-accent'
                  : 'text-text-primary hover:bg-base hover:text-accent'
              }`
            }
          >
            <item.icon size={18} className="shrink-0 text-accent" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-xl px-4 py-3 font-body text-sm uppercase text-text-primary transition hover:bg-base hover:text-accent"
      >
        <LogOut size={18} className="shrink-0 text-accent" />
        Sair
      </button>
    </>
  );

  return (
    <>
      <aside className="hidden min-h-screen w-64 shrink-0 flex-col bg-menu px-5 py-6 md:flex">
        {sidebarContent}
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 animate-fade-in"
            onClick={onClose}
          />
          <aside className="relative z-10 flex h-full w-64 flex-col bg-menu px-5 py-6 animate-slide-from-left">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
