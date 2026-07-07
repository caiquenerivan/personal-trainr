import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, User, LogOut, X } from 'lucide-react';
import logoFitnessGoldRunner from '../assets/logo-fitness-gold-runner.png';

const menuItems = [
  { label: 'Painel', to: '/aluno/painel', icon: Home },
  { label: 'Personal', to: '/aluno/personal', icon: Users },
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

  const sidebarNav = (
    <nav className="flex-1 min-h-0 space-y-2 overflow-y-auto">
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
  );

  const logoutButton = (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 rounded-xl px-4 py-3 font-body text-sm uppercase text-text-primary transition hover:bg-base hover:text-accent border border-border/20 hover:border-accent/40 bg-black/10"
    >
      <LogOut size={18} className="shrink-0 text-accent" />
      Sair
    </button>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden fixed inset-y-0 left-0 z-30 w-64 flex-col bg-menu px-5 py-6 md:flex">
        <div className="mb-10 border-b border-border pb-6">
          <img
            src={logoFitnessGoldRunner}
            alt="Fitness Gold Logo"
            className="w-full h-auto max-h-16 object-contain"
          />
        </div>
        {sidebarNav}
        <div className="mt-auto pt-4">{logoutButton}</div>
      </aside>

      {/* Mobile sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 animate-fade-in"
            onClick={onClose}
          />
          <aside className="absolute inset-y-0 left-0 z-10 flex w-72 max-w-[85vw] flex-col bg-menu px-4 py-5 shadow-2xl animate-slide-from-left">
            <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
              <img
                src={logoFitnessGoldRunner}
                alt="Fitness Gold Logo"
                className="flex-1 h-auto max-h-10 object-contain"
              />
              <button
                onClick={onClose}
                className="flex items-center justify-center text-text-secondary hover:text-accent min-h-[44px] min-w-[44px] shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            {sidebarNav}
            <div className="mt-auto pt-4">{logoutButton}</div>
          </aside>
        </div>
      )}
    </>
  );
}
