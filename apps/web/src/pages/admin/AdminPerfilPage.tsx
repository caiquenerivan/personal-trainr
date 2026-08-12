import { FormEvent, useEffect, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { Camera, User, Lock, Mail, Phone, AtSign, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { updateProfile, changePassword } from '../../api/student';
import { formatPhone, unformatPhone } from '../../utils/phone';

type ProfileData = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  phone?: string | null;
  username?: string | null;
};

type ActiveTab = 'perfil' | 'conta';

export function AdminPerfilPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountSuccess, setAccountSuccess] = useState(false);
  const [accountError, setAccountError] = useState('');

  const [activeTab, setActiveTab] = useState<ActiveTab>('perfil');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem('personaltrainr.user');
    if (!raw) return;
    let user: ProfileData;
    try {
      user = JSON.parse(raw);
    } catch {
      return;
    }
    setProfile(user);
    setName(user.name ?? '');
    setUsername(user.username ?? '');
    setPhone(formatPhone(user.phone ?? ''));
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  }

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);
    setProfileError('');

    try {
      const result = await updateProfile({
        name: name || undefined,
        avatarFile: selectedFile,
        phone: phone ? unformatPhone(phone) : null,
        username: username || null,
      });

      const updated = result.user;
      window.localStorage.setItem('personaltrainr.user', JSON.stringify(updated));
      setProfile(updated);
      setPhone(formatPhone(updated.phone ?? ''));
      setSelectedFile(null);
      setProfileSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof AxiosError ? String(err.response?.data?.message ?? '') : '';
      setProfileError(msg || 'Erro ao salvar alterações. Tente novamente.');
    } finally {
      setSavingProfile(false);
    }
  }

  function handleCancelProfile() {
    if (!profile) return;
    setName(profile.name ?? '');
    setUsername(profile.username ?? '');
    setPhone(formatPhone(profile.phone ?? ''));
    setSelectedFile(null);
    setProfileSuccess(false);
    setProfileError('');
  }

  async function handleAccountSubmit(e: FormEvent) {
    e.preventDefault();
    setAccountSuccess(false);
    setAccountError('');

    if (newPassword !== confirmPassword) {
      setAccountError('A Nova Senha e a Confirmação não coincidem.');
      return;
    }

    if (newPassword.length < 8) {
      setAccountError('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }

    setSavingAccount(true);

    try {
      await changePassword(currentPassword, newPassword);
      setAccountSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof AxiosError ? String(err.response?.data?.message ?? '') : '';
      setAccountError(msg === 'Current password is incorrect' ? 'Senha atual incorreta.' : msg || 'Erro ao alterar a senha. Tente novamente.');
    } finally {
      setSavingAccount(false);
    }
  }

  function handleCancelAccount() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setAccountSuccess(false);
    setAccountError('');
  }

  if (!profile) {
    return (
      <section className="mx-auto max-w-7xl">
        <p className="font-body text-text-secondary animate-pulse">Carregando perfil...</p>
      </section>
    );
  }

  const displayUrl = preview ?? profile.avatarUrl ?? null;
  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  return (
    <section className="mx-auto max-w-7xl">
      <div>
        <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-accent">PAINEL ADMIN</span>
        <h1 className="mt-2 font-title text-4xl uppercase text-white sm:text-5xl">Meu Perfil</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-text-secondary">
          Gerencie seus dados pessoais e a segurança da sua conta de administrador.
        </p>
      </div>

      {/* ─── Summary card ─────────────────────────────────── */}
      <div className="mt-8 rounded-xl bg-card p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {displayUrl ? (
                <img src={displayUrl} alt={`Foto de ${profile.name}`} className="h-24 w-24 rounded-full border-2 border-accent/40 object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-accent/20 bg-base text-3xl font-bold uppercase text-accent">
                  {profile.name.charAt(0)}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-black shadow-md transition hover:opacity-90 active:scale-95"
              >
                <Camera size={16} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
            {selectedFile && <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Nova foto selecionada</span>}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-title text-xl uppercase tracking-wide text-text-primary">{profile.name}</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-base px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent">
                <ShieldCheck size={12} />
                Admin
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Mail size={14} className="shrink-0 text-accent" />
                <div className="min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary">Email</span>
                  <span className="block truncate font-body text-sm text-text-primary">{profile.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AtSign size={14} className="shrink-0 text-accent" />
                <div className="min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary">Username</span>
                  <span className="block truncate font-body text-sm text-text-primary">{profile.username ? `@${profile.username}` : '—'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="shrink-0 text-accent" />
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-text-secondary">Telefone</span>
                  <span className="font-body text-sm text-text-primary">{profile.phone ? formatPhone(profile.phone) : '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tab selectors ────────────────────────────────── */}
      <div className="mt-6 flex max-w-xs gap-1 rounded-xl border border-border/20 bg-black/20 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('perfil')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 font-body text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'perfil' ? 'bg-accent text-black' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <User size={14} />
          Perfil
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('conta')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 font-body text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'conta' ? 'bg-accent text-black' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Lock size={14} />
          Conta
        </button>
      </div>

      {/* ─── Perfil tab ───────────────────────────────────── */}
      {activeTab === 'perfil' && (
        <form onSubmit={handleProfileSubmit} className="mt-6 max-w-2xl animate-fade-in rounded-xl bg-card p-6 md:p-8">
          <h3 className="mb-1 font-title text-lg uppercase tracking-wide text-text-primary">Informações Pessoais</h3>
          <p className="mb-6 text-xs text-text-secondary">Atualize seus dados de perfil.</p>

          <div className="space-y-5">
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Nome Completo</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full rounded-lg border border-border bg-base p-3 font-body text-sm text-text-primary outline-none transition focus:border-accent"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Nome de Usuário</span>
              <div className="relative">
                <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                  placeholder="@username"
                  className="w-full rounded-lg border border-border bg-base p-3 pl-10 font-body text-sm text-text-primary outline-none transition focus:border-accent"
                />
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Telefone</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                maxLength={16}
                className="w-full rounded-lg border border-border bg-base p-3 font-body text-sm text-text-primary outline-none transition focus:border-accent"
              />
            </label>
          </div>

          {profileSuccess && (
            <p role="status" className="mt-5 rounded-lg border border-green-500/30 bg-green-900/10 px-4 py-3 text-sm text-green-400">
              Perfil atualizado com sucesso.
            </p>
          )}
          {profileError && (
            <p role="alert" className="mt-5 rounded-lg border border-border px-4 py-3 text-sm text-accent">
              {profileError}
            </p>
          )}

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancelProfile}
              className="flex-1 rounded-lg border border-border bg-base px-5 py-3 font-body text-xs font-bold uppercase text-text-secondary transition hover:text-text-primary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingProfile}
              className="flex-1 rounded-lg bg-accent px-5 py-3 font-body text-xs font-bold uppercase text-black transition hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
            >
              {savingProfile ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {/* ─── Conta tab ────────────────────────────────────── */}
      {activeTab === 'conta' && (
        <form onSubmit={handleAccountSubmit} className="mt-6 max-w-2xl animate-fade-in rounded-xl bg-card p-6 md:p-8">
          <h3 className="mb-1 font-title text-lg uppercase tracking-wide text-text-primary">Segurança da Conta</h3>
          <p className="mb-6 text-xs text-text-secondary">Altere sua senha de acesso. Seu email não pode ser alterado.</p>

          <div className="space-y-5">
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Email</span>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  readOnly
                  className="w-full cursor-not-allowed rounded-lg border border-border bg-base p-3 pl-10 font-body text-sm text-text-secondary opacity-60 outline-none"
                />
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Senha Atual</span>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-border bg-base p-3 pl-10 pr-12 font-body text-sm text-text-primary outline-none transition focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition hover:text-text-primary"
                >
                  {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Nova Senha</span>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres, com letra e número"
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-border bg-base p-3 pl-10 pr-12 font-body text-sm text-text-primary outline-none transition focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition hover:text-text-primary"
                >
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Repetir Nova Senha</span>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                  required
                  minLength={8}
                  className={`w-full rounded-lg border bg-base p-3 pl-10 pr-12 font-body text-sm text-text-primary outline-none transition ${
                    passwordMismatch ? 'border-red-500/60 focus:border-red-500' : 'border-border focus:border-accent'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition hover:text-text-primary"
                >
                  {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordMismatch && <span className="text-[10px] font-bold text-red-400">As senhas não coincidem.</span>}
            </label>
          </div>

          {accountSuccess && (
            <p role="status" className="mt-5 rounded-lg border border-green-500/30 bg-green-900/10 px-4 py-3 text-sm text-green-400">
              Senha alterada com sucesso.
            </p>
          )}
          {accountError && (
            <p role="alert" className="mt-5 rounded-lg border border-border px-4 py-3 text-sm text-accent">
              {accountError}
            </p>
          )}

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancelAccount}
              className="flex-1 rounded-lg border border-border bg-base px-5 py-3 font-body text-xs font-bold uppercase text-text-secondary transition hover:text-text-primary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingAccount || passwordMismatch}
              className="flex-1 rounded-lg bg-accent px-5 py-3 font-body text-xs font-bold uppercase text-black transition hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
            >
              {savingAccount ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
