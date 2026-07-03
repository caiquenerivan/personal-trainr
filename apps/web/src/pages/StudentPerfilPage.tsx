import { FormEvent, useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { updateProfile } from '../api/student';
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
};

export function StudentPerfilPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem('personaltrainr.user');
    if (!raw) return;
    let user;
    try { user = JSON.parse(raw); } catch { return; }
    setProfile(user);
    setPhone(formatPhone(user.phone ?? ''));
    setWeight(user.weight?.toString() ?? '');
    setHeight(user.height?.toString() ?? '');
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');

    try {
      const result = await updateProfile({
        avatarFile: selectedFile,
        phone: phone ? unformatPhone(phone) : null,
        weight: weight ? Number(weight) : null,
        height: height ? Number(height) : null,
      });

      const updated = result.user;
      window.localStorage.setItem('personaltrainr.user', JSON.stringify(updated));
      setProfile(updated);
      setPhone(formatPhone(updated.phone ?? ''));
      setSelectedFile(null);
      setSuccess(true);
    } catch {
      setError('Erro ao salvar alterações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <section className="mx-auto max-w-7xl">
        <p className="font-body text-text-secondary">Carregando perfil...</p>
      </section>
    );
  }

  const displayUrl = preview ?? profile.avatarUrl ?? null;

  return (
    <section className="mx-auto max-w-7xl">
      <h1 className="font-title text-3xl uppercase text-text-primary">MEU PERFIL</h1>
      <p className="mt-1 text-sm text-text-secondary">{profile.email}</p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 max-w-lg rounded-2xl border border-border bg-card p-6"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              {displayUrl ? (
                <img
                  src={displayUrl}
                  alt={`Foto de ${profile.name}`}
                  className="h-24 w-24 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-base text-3xl font-bold uppercase text-text-secondary">
                  {profile.name.charAt(0)}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-black shadow transition hover:opacity-90"
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div>
              <p className="font-body text-text-primary">{profile.name}</p>
              <p className="text-xs uppercase text-text-secondary">{profile.role}</p>
            </div>
          </div>

          {selectedFile && (
            <p className="text-xs text-accent">Nova foto selecionada. Salve para aplicar.</p>
          )}

            <label className="block space-y-2">
              <span className="text-xs uppercase text-text-secondary">Telefone (WhatsApp)</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                maxLength={16}
                className="w-full rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
              />
            </label>

          <label className="block space-y-2">
            <span className="text-xs uppercase text-text-secondary">Peso Atual (kg)</span>
            <input
              type="number"
              step="0.1"
              min={0}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Ex: 75.5"
              className="w-full rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs uppercase text-text-secondary">Altura (cm)</span>
            <input
              type="number"
              step="0.1"
              min={0}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Ex: 175"
              className="w-full rounded-lg border border-border bg-base p-3 text-text-primary outline-none focus:border-accent"
            />
          </label>
        </div>

        {success && (
          <p role="status" className="mt-5 rounded-lg border border-green-500/30 bg-green-900/10 px-4 py-3 text-sm text-green-400">
            Perfil atualizado com sucesso.
          </p>
        )}

        {error && (
          <p role="alert" className="mt-5 rounded-lg border border-border px-4 py-3 text-sm text-accent">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-6 block min-h-12 w-full rounded-lg bg-accent px-5 font-bold uppercase text-black transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
        >
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
    </section>
  );
}
