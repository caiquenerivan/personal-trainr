import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginScreen } from './components/LoginScreen';
import { DashboardLayout } from './layouts/DashboardLayout';
import { StudentLayout } from './layouts/StudentLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { PublicRoute, TrainerRoute, StudentRoute, AdminRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const StudentsPage = lazy(() => import('./pages/StudentsPage').then((m) => ({ default: m.StudentsPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ExercisesPage = lazy(() => import('./pages/ExercisesPage').then((m) => ({ default: m.ExercisesPage })));
const ProgressPage = lazy(() => import('./pages/ProgressPage').then((m) => ({ default: m.ProgressPage })));
const RoutineBuilder = lazy(() => import('./components/RoutineBuilder').then((m) => ({ default: m.RoutineBuilder })));
const RoutinesPage = lazy(() => import('./pages/RoutinesPage').then((m) => ({ default: m.RoutinesPage })));
const RoutineViewPage = lazy(() => import('./pages/RoutineViewPage').then((m) => ({ default: m.RoutineViewPage })));
const RoutineEditPage = lazy(() => import('./pages/RoutineEditPage').then((m) => ({ default: m.RoutineEditPage })));
const MeuTreinoPage = lazy(() => import('./pages/MeuTreinoPage').then((m) => ({ default: m.MeuTreinoPage })));
const TrainerPerfilPage = lazy(() => import('./pages/TrainerPerfilPage').then((m) => ({ default: m.TrainerPerfilPage })));
const StudentDashboardPage = lazy(() => import('./pages/StudentDashboardPage').then((m) => ({ default: m.StudentDashboardPage })));
const StudentTreinosPage = lazy(() => import('./pages/StudentTreinosPage').then((m) => ({ default: m.StudentTreinosPage })));
const StudentTreinoHojePage = lazy(() => import('./pages/StudentTreinoHojePage').then((m) => ({ default: m.StudentTreinoHojePage })));
const StudentPerfilPage = lazy(() => import('./pages/StudentPerfilPage').then((m) => ({ default: m.StudentPerfilPage })));
const StudentPersonalPage = lazy(() => import('./pages/StudentPersonalPage').then((m) => ({ default: m.StudentPersonalPage })));
const ConvitePage = lazy(() => import('./pages/ConvitePage').then((m) => ({ default: m.ConvitePage })));
const AdminOverviewPage = lazy(() => import('./pages/admin/AdminOverviewPage').then((m) => ({ default: m.AdminOverviewPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })));
const AdminSubscriptionsPage = lazy(() => import('./pages/admin/AdminSubscriptionsPage').then((m) => ({ default: m.AdminSubscriptionsPage })));
const AdminExercisesPage = lazy(() => import('./pages/admin/AdminExercisesPage').then((m) => ({ default: m.AdminExercisesPage })));
const AdminPerfilPage = lazy(() => import('./pages/admin/AdminPerfilPage').then((m) => ({ default: m.AdminPerfilPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })));

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="font-body text-sm text-text-secondary">Carregando...</p>
    </div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <ErrorBoundary>
        <Routes>
        {/* ─── Public Routes ─────────────────────────────── */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
          <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        </Route>

        {/* ─── Trainer Routes ────────────────────────────── */}
        <Route element={<TrainerRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/painel" element={<DashboardPage />} />
            <Route path="/alunos" element={<StudentsPage />} />
            <Route path="/rotinas" element={<RoutinesPage />} />
            <Route path="/rotinas/nova" element={<RoutineBuilder />} />
            <Route path="/rotinas/ver/:id" element={<RoutineViewPage />} />
            <Route path="/rotinas/editar/:id" element={<RoutineEditPage />} />
            <Route path="/exercicios" element={<ExercisesPage />} />
            <Route path="/progresso" element={<ProgressPage />} />
            <Route path="/meu-treino" element={<MeuTreinoPage />} />
            <Route path="/perfil" element={<TrainerPerfilPage />} />
          </Route>
        </Route>

        {/* ─── Student Routes ────────────────────────────── */}
        <Route element={<StudentRoute />}>
          <Route element={<StudentLayout />}>
            <Route path="/aluno/painel" element={<StudentDashboardPage />} />
            <Route path="/aluno/treinos" element={<StudentTreinosPage />} />
            <Route path="/aluno/treino-hoje" element={<StudentTreinoHojePage />} />
            <Route path="/aluno/perfil" element={<StudentPerfilPage />} />
            <Route path="/aluno/personal" element={<StudentPersonalPage />} />
          </Route>
        </Route>

        {/* ─── Admin Routes ──────────────────────────────── */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminOverviewPage />} />
            <Route path="/admin/usuarios" element={<AdminUsersPage />} />
            <Route path="/admin/assinaturas" element={<AdminSubscriptionsPage />} />
            <Route path="/admin/exercicios" element={<AdminExercisesPage />} />
            <Route path="/admin/perfil" element={<AdminPerfilPage />} />
          </Route>
        </Route>

        {/* ─── Public (no guard) ─────────────────────────── */}
        <Route path="/convite/:username" element={<ConvitePage />} />
        <Route path="/privacidade" element={<PrivacyPolicyPage />} />
        <Route path="/termos" element={<TermsPage />} />

        {/* ─── Fallback ──────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ErrorBoundary>
    </Suspense>
    </BrowserRouter>
  );
}
