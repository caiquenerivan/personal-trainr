import { useEffect, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { Search, Pencil, KeyRound, Ban, CheckCircle2, Trash2 } from 'lucide-react';
import {
  listUsers,
  updateUser,
  setUserActive,
  resetUserPassword,
  deleteUser,
  type AdminUser,
  type Role,
} from '../../api/admin';
import { Modal } from '../../components/Modal';

const roleFilters: Array<{ label: string; value: Role | 'TODOS' }> = [
  { label: 'Todos', value: 'TODOS' },
  { label: 'Admins', value: 'ADMIN' },
  { label: 'Trainers', value: 'TRAINER' },
  { label: 'Alunos', value: 'ALUNO' },
];

const ROLE_LABELS: Record<Role, string> = { ADMIN: 'Admin', TRAINER: 'Trainer', ALUNO: 'Aluno' };

const PAGE_SIZE = 20;

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'TODOS'>('TODOS');

  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', username: '', phone: '', role: 'ALUNO' as Role });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [confirmTarget, setConfirmTarget] = useState<{ user: AdminUser; action: 'activate' | 'deactivate' | 'delete' } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const [tempPassword, setTempPassword] = useState<{ user: AdminUser; password: string } | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  function loadUsers() {
    setLoading(true);
    listUsers({
      role: roleFilter === 'TODOS' ? undefined : roleFilter,
      search: search || undefined,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((data) => {
        setUsers(data.users);
        setTotal(data.total);
      })
      .catch(() => showToast('Erro ao carregar usuários'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function openEdit(user: AdminUser) {
    setEditTarget(user);
    setEditError(null);
    setEditForm({
      name: user.name,
      email: user.email,
      username: user.username,
      phone: user.phone ?? '',
      role: user.role,
    });
  }

  async function handleSaveEdit() {
    if (!editTarget) return;
    setSaving(true);
    setEditError(null);
    try {
      await updateUser(editTarget.id, {
        name: editForm.name,
        email: editForm.email,
        username: editForm.username,
        phone: editForm.phone || null,
        role: editForm.role,
      });
      showToast('Usuário atualizado com sucesso!');
      setEditTarget(null);
      loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof AxiosError ? err.response?.data?.message || 'Erro ao atualizar usuário' : 'Erro ao atualizar usuário';
      setEditError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmAction() {
    if (!confirmTarget) return;
    setConfirming(true);
    try {
      if (confirmTarget.action === 'delete') {
        await deleteUser(confirmTarget.user.id);
        showToast('Usuário excluído.');
      } else {
        await setUserActive(confirmTarget.user.id, confirmTarget.action === 'activate');
        showToast(confirmTarget.action === 'activate' ? 'Usuário ativado.' : 'Usuário desativado.');
      }
      setConfirmTarget(null);
      loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof AxiosError ? err.response?.data?.message || 'Erro ao processar ação' : 'Erro ao processar ação';
      showToast(msg);
    } finally {
      setConfirming(false);
    }
  }

  async function handleResetPassword(user: AdminUser) {
    try {
      const password = await resetUserPassword(user.id);
      setTempPassword({ user, password });
    } catch (err: unknown) {
      const msg = err instanceof AxiosError ? err.response?.data?.message || 'Erro ao resetar senha' : 'Erro ao resetar senha';
      showToast(msg);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="mx-auto max-w-7xl">
      <div>
        <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-accent">PAINEL ADMIN</span>
        <h1 className="mt-2 font-title text-4xl uppercase text-white sm:text-5xl">Usuários</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-text-secondary">
          Gerencie contas, permissões e status de acesso.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nome, email ou username"
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {roleFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setRoleFilter(f.value);
                setPage(1);
              }}
              className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                roleFilter === f.value ? 'bg-accent text-black' : 'bg-card text-text-secondary hover:text-text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-text-secondary">
              <th className="px-5 py-4">Nome</th>
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4">Papel</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-text-secondary">
                  Carregando...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-text-secondary">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-4 text-text-primary">{u.name}</td>
                  <td className="px-5 py-4 text-text-secondary">{u.email}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-base px-3 py-1 text-xs uppercase text-accent">{ROLE_LABELS[u.role]}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs uppercase ${u.isActive ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                      {u.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <button
                        title="Editar"
                        onClick={() => openEdit(u)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition hover:bg-base hover:text-accent"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        title="Resetar senha"
                        onClick={() => handleResetPassword(u)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition hover:bg-base hover:text-accent"
                      >
                        <KeyRound size={16} />
                      </button>
                      {u.isActive ? (
                        <button
                          title="Desativar"
                          onClick={() => setConfirmTarget({ user: u, action: 'deactivate' })}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition hover:bg-base hover:text-yellow-400"
                        >
                          <Ban size={16} />
                        </button>
                      ) : (
                        <button
                          title="Ativar"
                          onClick={() => setConfirmTarget({ user: u, action: 'activate' })}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition hover:bg-base hover:text-green-400"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button
                        title="Excluir"
                        onClick={() => setConfirmTarget({ user: u, action: 'delete' })}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition hover:bg-base hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg bg-card px-4 py-2 text-xs uppercase text-text-secondary transition disabled:opacity-40 enabled:hover:text-accent"
          >
            Anterior
          </button>
          <span className="text-xs text-text-secondary">
            Página {page} de {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg bg-card px-4 py-2 text-xs uppercase text-text-secondary transition disabled:opacity-40 enabled:hover:text-accent"
          >
            Próxima
          </button>
        </div>
      )}

      {/* ─── Edit modal ─────────────────────────────────── */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar usuário">
        <div className="space-y-4">
          {editError && <p className="rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-400">{editError}</p>}
          <div>
            <label className="mb-1 block text-xs uppercase text-text-secondary">Nome</label>
            <input
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-border bg-base px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase text-text-secondary">Email</label>
            <input
              value={editForm.email}
              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border border-border bg-base px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase text-text-secondary">Username</label>
            <input
              value={editForm.username}
              onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
              className="w-full rounded-lg border border-border bg-base px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase text-text-secondary">Telefone</label>
            <input
              value={editForm.phone}
              onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg border border-border bg-base px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase text-text-secondary">Papel</label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as Role }))}
              className="w-full rounded-lg border border-border bg-base px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="ALUNO">Aluno</option>
              <option value="TRAINER">Trainer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setEditTarget(null)}
              className="rounded-lg px-4 py-2.5 text-sm text-text-secondary transition hover:text-text-primary"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-accent-light disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Confirm action modal ───────────────────────── */}
      <Modal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        title={
          confirmTarget?.action === 'delete'
            ? 'Excluir usuário'
            : confirmTarget?.action === 'activate'
              ? 'Ativar usuário'
              : 'Desativar usuário'
        }
      >
        <p className="text-sm text-text-secondary">
          {confirmTarget?.action === 'delete' && (
            <>Tem certeza que deseja excluir permanentemente <strong className="text-text-primary">{confirmTarget.user.name}</strong>? Essa ação não pode ser desfeita.</>
          )}
          {confirmTarget?.action === 'deactivate' && (
            <>
              Tem certeza que deseja desativar <strong className="text-text-primary">{confirmTarget.user.name}</strong>? A conta não poderá mais fazer login.
            </>
          )}
          {confirmTarget?.action === 'activate' && (
            <>
              Tem certeza que deseja reativar <strong className="text-text-primary">{confirmTarget.user.name}</strong>?
            </>
          )}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setConfirmTarget(null)}
            className="rounded-lg px-4 py-2.5 text-sm text-text-secondary transition hover:text-text-primary"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmAction}
            disabled={confirming}
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
              confirmTarget?.action === 'activate' ? 'bg-accent text-black hover:bg-accent-light' : 'bg-red-600 text-white hover:bg-red-500'
            }`}
          >
            {confirming ? 'Processando...' : 'Confirmar'}
          </button>
        </div>
      </Modal>

      {/* ─── Temp password modal ────────────────────────── */}
      <Modal open={!!tempPassword} onClose={() => setTempPassword(null)} title="Senha redefinida">
        <p className="text-sm text-text-secondary">
          Nova senha temporária para <strong className="text-text-primary">{tempPassword?.user.name}</strong>. Compartilhe com segurança — ela não será exibida novamente.
        </p>
        <div className="mt-4 rounded-lg bg-base px-4 py-3 font-number text-lg text-accent">{tempPassword?.password}</div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setTempPassword(null)}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-accent-light"
          >
            Fechar
          </button>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-card px-5 py-3 text-sm text-text-primary shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </section>
  );
}
