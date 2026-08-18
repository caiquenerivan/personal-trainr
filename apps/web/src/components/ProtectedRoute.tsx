import { Navigate, Outlet } from 'react-router-dom';

function getUser() {
  try {
    const raw = window.localStorage.getItem('personaltrainr.user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getToken() {
  return window.localStorage.getItem('personaltrainr.token');
}

export function PublicRoute() {
  const user = getUser();
  const token = getToken();

  if (token && user) {
    if (user.role === 'ALUNO') return <Navigate to="/aluno/painel" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/painel" replace />;
  }

  return <Outlet />;
}

export function TrainerRoute() {
  const token = getToken();
  const user = getUser();

  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.role !== 'TRAINER') return <Navigate to="/aluno/painel" replace />;

  return <Outlet />;
}

export function StudentRoute() {
  const token = getToken();
  const user = getUser();

  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.role !== 'ALUNO') return <Navigate to="/painel" replace />;

  return <Outlet />;
}

// Qualquer usuário autenticado, independente de role — usado pela página de
// configuração de 2FA, que TRAINER/ALUNO acessam opcionalmente e ADMIN é
// forçado a completar.
export function AuthenticatedRoute() {
  const token = getToken();
  const user = getUser();

  if (!token || !user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export function AdminRoute() {
  const token = getToken();
  const user = getUser();

  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') {
    return <Navigate to={user.role === 'ALUNO' ? '/aluno/painel' : '/painel'} replace />;
  }

  return <Outlet />;
}
