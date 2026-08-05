import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearUserData } from '../utils/userStorage';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Library,
  BarChart3,
  Dumbbell,
  User,
  LogOut,
  X,
} from 'lucide-react';
import logoFitnessGoldRunner from '../assets/logo-fitness-gold-runner.png';
import type { UserData } from '../api/auth';
import { getSubscription, PlanTier } from '../api/billing';

const PLAN_LABELS: Record<PlanTier, string> = {
  FREE: 'Plano Grátis',
  PRO: 'Plano Pro',
  UNLIMITED: 'Plano Ilimitado',
};

const menuItems = [
  { label: 'Painel', to: '/painel', icon: LayoutDashboard },
  { label: 'Alunos', to: '/alunos', icon: Users },
  { label: 'Rotinas', to: '/rotinas', icon: ClipboardList },
  { label: 'Exercícios', to: '/exercicios', icon: Library },
  { label: 'Meu Treino', to: '/meu-treino', icon: Dumbbell },
  { label: 'Progresso', to: '/progresso', icon: BarChart3 },
  { label: 'Perfil', to: '/perfil', icon: User },
];

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
  user?: UserData | null;
};

export function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  const navigate = useNavigate();
  const [planLabel, setPlanLabel] = useState<string | null>(null);

  useEffect(() => {
    getSubscription()
      .then(({ subscription }) => setPlanLabel(PLAN_LABELS[subscription.plan]))
      .catch(() => {});
  }, []);

  function handleLogout() {
    clearUserData();
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
        <img src={logoFitnessGoldRunner} alt="Personal Trainr" className="w-full h-auto object-contain" />
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

      <div className="mt-auto space-y-3 border-t border-border pt-4">
        <div className="flex items-center gap-3 rounded-xl px-4 py-2">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-base text-xs uppercase text-text-secondary">
              {user?.name?.charAt(0) ?? '?'}
            </div>
          )}
          <div className="min-w-0">
            <span className="block truncate font-body text-sm text-text-primary">
              {user?.name ?? 'Usuário'}
            </span>
            <span className="block truncate font-body text-[11px] text-text-secondary">
              Personal Trainer{planLabel ? ` · ${planLabel}` : ''}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl px-4 py-3 font-body text-sm uppercase text-text-primary transition hover:bg-base hover:text-accent"
        >
          <LogOut size={18} className="shrink-0 text-accent" />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-menu px-5 py-6 md:flex">
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
