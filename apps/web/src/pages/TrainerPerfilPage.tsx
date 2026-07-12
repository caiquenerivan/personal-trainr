import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  Camera,
  User,
  Lock,
  Mail,
  Phone,
  AtSign,
  Quote,
  Eye,
  EyeOff,
  Scale,
  Ruler,
} from 'lucide-react';
import { DateInput } from '../components/DateInput';
import { updateProfile, changePassword } from '../api/student';
import { formatPhone, unformatPhone } from '../utils/phone';

type ProfileData = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  phone?: string | null;
  username?: string | null;
  bio?: string | null;
  instagram?: string | null;
  weight?: number | null;
  height?: number | null;
  birthDate?: string | null;
};

type ActiveTab = 'perfil' | 'conta';

export function TrainerPerfilPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [birthDate, setBirthDate] = useState('');
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
    setBio(user.bio ?? '');
    setInstagram(user.instagram ?? '');
    setWeight(user.weight != null ? String(user.weight) : '');
    setHeight(user.height != null ? String(user.height) : '');
    setBirthDate(user.birthDate ? user.birthDate.substring(0, 10) : '');
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
        bio: bio || null,
        instagram: instagram || null,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
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
    setUsername(profile.username ?? '');
    setPhone(formatPhone(profile.phone ?? ''));
    setBio(profile.bio ?? '');
    setInstagram(profile.instagram ?? '');
    setWeight(profile.weight != null ? String(profile.weight) : '');
    setHeight(profile.height != null ? String(profile.height) : '');
    setBirthDate(profile.birthDate ? profile.birthDate.substring(0, 10) : '');
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

      <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 shadow-xl shadow-black/30 hover:shadow-[0_0_25px_rgba(175,145,80,0.3)] transition-all duration-300">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {displayUrl ? (
                <img
                  src={displayUrl}
                  alt={`Foto de ${profile.name}`}
                  loading="lazy"
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

          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
            <div className="col-span-2 sm:col-span-3 lg:col-span-4 mb-1">
              <h2 className="font-title text-xl uppercase tracking-wide text-text-primary">
                {profile.name}
              </h2>
              <span className="text-[10px] uppercase font-bold text-accent tracking-widest">
                Personal Trainer
              </span>
              {profile.bio && (
                <p className="mt-2 font-body text-sm leading-relaxed text-text-secondary line-clamp-2">
                  {profile.bio}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <AtSign size={14} className="text-accent shrink-0" />
              <div className="min-w-0">
                <span className="block text-[9px] uppercase font-bold text-text-secondary tracking-wider">Username</span>
                <span className="font-body text-sm text-text-primary truncate block">{profile.username ? `@${profile.username}` : '—'}</span>
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
              <AtSign size={14} className="text-accent shrink-0" />
              <div className="min-w-0">
                <span className="block text-[9px] uppercase font-bold text-text-secondary tracking-wider">Instagram</span>
                <span className="font-body text-sm text-text-primary truncate block">{profile.instagram ? `@${profile.instagram.replace('@', '')}` : '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      {activeTab === 'perfil' && (
        <form
          onSubmit={handleProfileSubmit}
          className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 max-w-2xl animate-fade-in shadow-xl shadow-black/30 hover:shadow-[0_0_25px_rgba(175,145,80,0.3)] transition-all duration-300"
        >
          <h3 className="font-title text-lg uppercase tracking-wide text-text-primary mb-1">
            INFORMAÇÕES PESSOAIS
          </h3>
          <p className="text-xs text-text-secondary mb-6">
            Atualize suas informações de perfil.
          </p>

          <div className="space-y-5">
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Nome Completo</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full rounded-lg border border-border bg-base p-3 text-text-primary font-body text-sm outline-none focus:border-accent transition"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Nome de Usuário</span>
              <div className="relative">
                <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                  placeholder="@username"
                  className="w-full rounded-lg border border-border bg-base p-3 pl-10 text-text-primary font-body text-sm outline-none focus:border-accent transition"
                />
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Bio</span>
              <div className="relative">
                <Quote size={16} className="absolute left-3 top-3 text-accent" />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte um pouco sobre você..."
                  rows={4}
                  className="w-full rounded-lg border border-border bg-base p-3 pl-10 text-text-primary font-body text-sm outline-none focus:border-accent transition resize-none"
                />
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Telefone (WhatsApp)</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                maxLength={16}
                className="w-full rounded-lg border border-border bg-base p-3 text-text-primary font-body text-sm outline-none focus:border-accent transition"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Instagram</span>
              <div className="relative">
                <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value.replace(/\s/g, ''))}
                  placeholder="@instagram"
                  className="w-full rounded-lg border border-border bg-base p-3 pl-10 text-text-primary font-body text-sm outline-none focus:border-accent transition"
                />
              </div>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Peso (kg)</span>
                <div className="relative">
                  <Scale size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Ex: 80"
                    className="w-full rounded-lg border border-border bg-base p-3 pl-10 text-text-primary font-number text-sm outline-none focus:border-accent transition"
                  />
                </div>
              </label>

              <label className="block space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Altura (cm)</span>
                <div className="relative">
                  <Ruler size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="Ex: 175"
                    className="w-full rounded-lg border border-border bg-base p-3 pl-10 text-text-primary font-number text-sm outline-none focus:border-accent transition"
                  />
                </div>
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Data de Nascimento</span>
              <DateInput value={birthDate} onChange={setBirthDate} />
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
          className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 max-w-2xl animate-fade-in shadow-xl shadow-black/30 hover:shadow-[0_0_25px_rgba(175,145,80,0.3)] transition-all duration-300"
        >
          <h3 className="font-title text-lg uppercase tracking-wide text-text-primary mb-1">
            SEGURANÇA DA CONTA
          </h3>
          <p className="text-xs text-text-secondary mb-6">
            Altere sua senha de acesso. Seu email não pode ser alterado.
          </p>

          <div className="space-y-5">
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Email</span>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  readOnly
                  className="w-full rounded-lg border border-border bg-base p-3 pl-10 text-text-secondary font-body text-sm outline-none cursor-not-allowed opacity-60"
                />
              </div>
            </label>

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
                  className="w-full rounded-lg border border-border bg-base p-3 pl-10 pr-12 text-text-primary font-body text-sm outline-none focus:border-accent transition"
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
                  className="w-full rounded-lg border border-border bg-base p-3 pl-10 pr-12 text-text-primary font-body text-sm outline-none focus:border-accent transition"
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
                  className={`w-full rounded-lg border bg-base p-3 pl-10 pr-12 text-text-primary font-body text-sm outline-none transition ${
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
