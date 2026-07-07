import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  Camera,
  User,
  Lock,
  Mail,
  Phone,
  Scale,
  Ruler,
  Calendar,
  Target,
  Trophy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { updateProfile, changePassword } from '../api/student';
import { formatPhone, unformatPhone } from '../utils/phone';

type ProfileData = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  phone?: string | null;
  weight?: number | null;
  height?: number | null;
  birthDate?: string | null;
};

type ActiveTab = 'perfil' | 'conta';

function calculateAge(birthDateStr: string | null | undefined): string {
  if (!birthDateStr) return '—';
  const birth = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age > 0 ? `${age} anos` : '—';
}

export function StudentPerfilPage() {
  // ─── Profile State ─────────────────────────────────────────
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // ─── Account State ─────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountSuccess, setAccountSuccess] = useState(false);
  const [accountError, setAccountError] = useState('');

  // ─── UI State ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('perfil');
  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Computed stats ────────────────────────────────────────
  const completedWorkouts = (() => {
    try {
      const raw = window.localStorage.getItem('personaltrainr.localHistory');
      return raw ? JSON.parse(raw).length : 0;
    } catch {
      return 0;
    }
  })();

  const objective = (() => {
    try {
      return window.localStorage.getItem('personaltrainr.objective') ?? 'Hipertrofia';
    } catch {
      return 'Hipertrofia';
    }
  })();

  // ─── Init ─────────────────────────────────────────────────
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
    setPhone(formatPhone(user.phone ?? ''));
    setWeight(user.weight?.toString() ?? '');
    setHeight(user.height?.toString() ?? '');
    setBirthDate(user.birthDate ? user.birthDate.slice(0, 10) : '');
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

  // ─── Profile Submit ───────────────────────────────────────
  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);
    setProfileError('');

    try {
      const result = await updateProfile({
        avatarFile: selectedFile,
        phone: phone ? unformatPhone(phone) : null,
        weight: weight ? Number(weight) : null,
        height: height ? Number(height) : null,
        birthDate: birthDate || null,
      });

      const updated = result.user;
      window.localStorage.setItem('personaltrainr.user', JSON.stringify(updated));
      setProfile(updated);
      setPhone(formatPhone(updated.phone ?? ''));
      setSelectedFile(null);
      setProfileSuccess(true);
    } catch {
      setProfileError('Erro ao salvar alterações. Tente novamente.');
    } finally {
      setSavingProfile(false);
    }
  }

  function handleCancelProfile() {
    if (!profile) return;
    setName(profile.name ?? '');
    setPhone(formatPhone(profile.phone ?? ''));
    setWeight(profile.weight?.toString() ?? '');
    setHeight(profile.height?.toString() ?? '');
    setBirthDate(profile.birthDate ? profile.birthDate.slice(0, 10) : '');
    setSelectedFile(null);
    setProfileSuccess(false);
    setProfileError('');
  }

  // ─── Account Submit ───────────────────────────────────────
  async function handleAccountSubmit(e: FormEvent) {
    e.preventDefault();
    setAccountSuccess(false);
    setAccountError('');

    if (newPassword !== confirmPassword) {
      setAccountError('A Nova Senha e a Confirmação não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      setAccountError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setSavingAccount(true);

    try {
      await changePassword(currentPassword, newPassword);
      setAccountSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg === 'Current password is incorrect') {
        setAccountError('Senha atual incorreta.');
      } else {
        setAccountError('Erro ao alterar a senha. Tente novamente.');
      }
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

  // ─── Loading ──────────────────────────────────────────────
  if (!profile) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8">
        <p className="font-body text-text-secondary animate-pulse">Carregando perfil...</p>
      </section>
    );
  }

  const displayUrl = preview ?? profile.avatarUrl ?? null;
  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  return (
    <section className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8 space-y-8">
      {/* ─── Page Header ─────────────────────────────────────── */}
      <div>
        <span className="block text-[10px] uppercase tracking-[0.2em] font-bold text-accent mb-1">
          CONTAS
        </span>
        <h1 className="font-title text-3xl sm:text-4xl uppercase tracking-wider text-text-primary">
          MEU PERFIL
        </h1>
        <p className="mt-2 font-body text-sm text-text-secondary leading-relaxed">
          Gerencie seus dados pessoais e preferências da conta.
        </p>
      </div>

      {/* ─── Summary Card ────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/60 bg-[#262626] p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {displayUrl ? (
                <img
                  src={displayUrl}
                  alt={`Foto de ${profile.name}`}
                  className="h-28 w-28 rounded-full object-cover border-2 border-accent/40 shadow-lg"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-base text-4xl font-bold uppercase text-accent border-2 border-accent/20">
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
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            {selectedFile && (
              <span className="text-[10px] text-accent font-bold uppercase tracking-wider">
                Nova foto selecionada
              </span>
            )}
          </div>

          {/* Info Grid */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
            {/* Name */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-4 mb-1">
              <h2 className="font-title text-xl uppercase tracking-wide text-text-primary">
                {profile.name}
              </h2>
              <span className="text-[10px] uppercase font-bold text-accent tracking-widest">
                {profile.role === 'ALUNO' ? 'Aluno' : 'Trainer'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Target size={14} className="text-accent shrink-0" />
              <div>
                <span className="block text-[9px] uppercase font-bold text-text-secondary tracking-wider">Objetivo</span>
                <span className="font-body text-sm text-text-primary">{objective}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Mail size={14} className="text-accent shrink-0" />
              <div className="min-w-0">
                <span className="block text-[9px] uppercase font-bold text-text-secondary tracking-wider">Email</span>
                <span className="font-body text-sm text-text-primary truncate block">{profile.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Phone size={14} className="text-accent shrink-0" />
              <div>
                <span className="block text-[9px] uppercase font-bold text-text-secondary tracking-wider">Telefone</span>
                <span className="font-body text-sm text-text-primary">{profile.phone ? formatPhone(profile.phone) : '—'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Scale size={14} className="text-accent shrink-0" />
              <div>
                <span className="block text-[9px] uppercase font-bold text-text-secondary tracking-wider">Peso</span>
                <span className="font-number text-base font-bold text-accent">{profile.weight ? `${profile.weight} kg` : '—'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Ruler size={14} className="text-accent shrink-0" />
              <div>
                <span className="block text-[9px] uppercase font-bold text-text-secondary tracking-wider">Altura</span>
                <span className="font-number text-base font-bold text-accent">{profile.height ? `${profile.height} cm` : '—'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-accent shrink-0" />
              <div>
                <span className="block text-[9px] uppercase font-bold text-text-secondary tracking-wider">Idade</span>
                <span className="font-body text-sm text-text-primary">{calculateAge(profile.birthDate)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-accent shrink-0" />
              <div>
                <span className="block text-[9px] uppercase font-bold text-text-secondary tracking-wider">Treinos</span>
                <span className="font-number text-base font-bold text-accent">{completedWorkouts}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tab Selectors ───────────────────────────────────── */}
      <div className="flex gap-1 rounded-xl bg-black/20 border border-border/20 p-1 max-w-xs">
        <button
          type="button"
          onClick={() => setActiveTab('perfil')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-body text-xs font-bold uppercase tracking-wider transition active:scale-95 ${
            activeTab === 'perfil'
              ? 'bg-accent text-black shadow'
              : 'text-text-secondary hover:text-text-primary hover:bg-base/30'
          }`}
        >
          <User size={14} />
          Perfil
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('conta')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-body text-xs font-bold uppercase tracking-wider transition active:scale-95 ${
            activeTab === 'conta'
              ? 'bg-accent text-black shadow'
              : 'text-text-secondary hover:text-text-primary hover:bg-base/30'
          }`}
        >
          <Lock size={14} />
          Conta
        </button>
      </div>

      {/* ─── Tab Content ─────────────────────────────────────── */}
      {activeTab === 'perfil' && (
        <form
          onSubmit={handleProfileSubmit}
          className="rounded-2xl border border-border/60 bg-[#262626] p-6 md:p-8 max-w-2xl animate-fade-in"
        >
          <h3 className="font-title text-lg uppercase tracking-wide text-text-primary mb-1">
            INFORMAÇÕES PESSOAIS
          </h3>
          <p className="text-xs text-text-secondary mb-6">
            Atualize suas informações de perfil e dados de medida.
          </p>

          <div className="space-y-5">
            {/* Name */}
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Nome Completo</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full rounded-lg border border-border bg-[#333333] p-3 text-text-primary font-body text-sm outline-none focus:border-accent transition"
              />
            </label>

            {/* Phone */}
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Telefone (WhatsApp)</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                maxLength={16}
                className="w-full rounded-lg border border-border bg-[#333333] p-3 text-text-primary font-body text-sm outline-none focus:border-accent transition"
              />
            </label>

            {/* Weight + Height (side by side) */}
            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Peso (kg)</span>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Ex: 75.5"
                  className="w-full rounded-lg border border-border bg-[#333333] p-3 text-text-primary font-body text-sm outline-none focus:border-accent transition"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Altura (cm)</span>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Ex: 175"
                  className="w-full rounded-lg border border-border bg-[#333333] p-3 text-text-primary font-body text-sm outline-none focus:border-accent transition"
                />
              </label>
            </div>

            {/* Birth Date */}
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Data de Nascimento</span>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-[#333333] p-3 text-text-primary font-body text-sm outline-none focus:border-accent transition"
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
              className="flex-1 rounded-lg border border-border bg-base px-5 py-3 font-body text-xs font-bold uppercase text-text-secondary transition hover:text-text-primary hover:border-text-secondary active:scale-98"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingProfile}
              className="flex-1 rounded-lg bg-accent px-5 py-3 font-body text-xs font-bold uppercase text-black transition hover:opacity-90 active:scale-98 disabled:opacity-50 disabled:cursor-wait"
            >
              {savingProfile ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'conta' && (
        <form
          onSubmit={handleAccountSubmit}
          className="rounded-2xl border border-border/60 bg-[#262626] p-6 md:p-8 max-w-2xl animate-fade-in"
        >
          <h3 className="font-title text-lg uppercase tracking-wide text-text-primary mb-1">
            SEGURANÇA DA CONTA
          </h3>
          <p className="text-xs text-text-secondary mb-6">
            Altere sua senha de acesso. Seu email não pode ser alterado.
          </p>

          <div className="space-y-5">
            {/* Email (readonly) */}
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Email</span>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  readOnly
                  className="w-full rounded-lg border border-border bg-[#333333] p-3 pl-10 text-text-secondary font-body text-sm outline-none cursor-not-allowed opacity-60"
                />
              </div>
            </label>

            {/* Current Password */}
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Senha Atual</span>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-border bg-[#333333] p-3 pl-10 pr-12 text-text-primary font-body text-sm outline-none focus:border-accent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition"
                >
                  {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {/* New Password */}
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Nova Senha</span>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-border bg-[#333333] p-3 pl-10 pr-12 text-text-primary font-body text-sm outline-none focus:border-accent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition"
                >
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {/* Confirm New Password */}
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Repetir Nova Senha</span>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                  required
                  minLength={6}
                  className={`w-full rounded-lg border bg-[#333333] p-3 pl-10 pr-12 text-text-primary font-body text-sm outline-none transition ${
                    passwordMismatch
                      ? 'border-red-500/60 focus:border-red-500'
                      : 'border-border focus:border-accent'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition"
                >
                  {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordMismatch && (
                <span className="text-[10px] text-red-400 font-bold">As senhas não coincidem.</span>
              )}
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
              className="flex-1 rounded-lg border border-border bg-base px-5 py-3 font-body text-xs font-bold uppercase text-text-secondary transition hover:text-text-primary hover:border-text-secondary active:scale-98"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingAccount || passwordMismatch}
              className="flex-1 rounded-lg bg-accent px-5 py-3 font-body text-xs font-bold uppercase text-black transition hover:opacity-90 active:scale-98 disabled:opacity-50 disabled:cursor-wait"
            >
              {savingAccount ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
