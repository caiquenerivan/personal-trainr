import type { LucideIcon } from 'lucide-react-native';
import {
  BarChart3,
  ClipboardList,
  Dumbbell,
  Home,
  LayoutDashboard,
  Library,
  TrendingUp,
  User,
  Users,
} from 'lucide-react-native';
import type { Role } from '@personaltrainr/shared';

export type MenuItem = { route: string; label: string; icon: LucideIcon };

// Mesmos itens e ordem dos menus laterais do web (Sidebar e StudentSidebar).
const alunoMenu: MenuItem[] = [
  { route: 'index', label: 'Painel', icon: Home },
  { route: 'evolucao', label: 'Evolução', icon: TrendingUp },
  { route: 'personal', label: 'Personal', icon: Users },
  { route: 'perfil', label: 'Perfil', icon: User },
];

const trainerMenu: MenuItem[] = [
  { route: 'index', label: 'Painel', icon: LayoutDashboard },
  { route: 'alunos', label: 'Alunos', icon: Users },
  { route: 'rotinas', label: 'Rotinas', icon: ClipboardList },
  { route: 'exercicios', label: 'Exercícios', icon: Library },
  { route: 'meu-treino', label: 'Meu Treino', icon: Dumbbell },
  { route: 'evolucao', label: 'Minha Evolução', icon: TrendingUp },
  { route: 'progresso', label: 'Progresso', icon: BarChart3 },
  { route: 'perfil', label: 'Perfil', icon: User },
];

export function menuForRole(role: Role): MenuItem[] {
  return role === 'TRAINER' ? trainerMenu : alunoMenu;
}

export const ROLE_LABELS: Record<Role, string> = {
  ALUNO: 'Aluno',
  TRAINER: 'Personal',
  ADMIN: 'Administrador',
};
