import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { setupTwoFactor, confirmTwoFactor, type UserData } from '../api/auth';

function routeForRole(role: UserData['role']): string {
  if (role === 'ALUNO') return '/aluno/painel';
  if (role === 'ADMIN') return '/admin';
  return '/painel';
}

export function TwoFactorSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const forced = Boolean((location.state as { forced?: boolean } | null)?.forced);

  const [step, setStep] = useState<'loading' | 'scan' | 'done'>('loading');
  const [secret, setSecret] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setupTwoFactor()
      .then((result) => {
        setSecret(result.secret);
        setQrCodeDataUrl(result.qrCodeDataUrl);
        setStep('scan');
      })
      .catch(() => setError('Erro ao iniciar configuração do 2FA. Tente novamente.'));
  }, []);

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setConfirming(true);
    try {
      const result = await confirmTwoFactor(code);
      setBackupCodes(result.backupCodes);
      setStep('done');

      const userRaw = window.localStorage.getItem('personaltrainr.user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        user.twoFactorEnabled = true;
        user.requiresTwoFactorSetup = false;
        window.localStorage.setItem('personaltrainr.user', JSON.stringify(user));
      }
    } catch (err: unknown) {
      const msg =
        err instanceof AxiosError
          ? String(err.response?.data?.message ?? '')
          : '';
      setError(msg || 'Código inválido. Tente novamente.');
    } finally {
      setConfirming(false);
    }
  }

  function handleFinish() {
    const userRaw = window.localStorage.getItem('personaltrainr.user');
    const user = userRaw ? (JSON.parse(userRaw) as UserData) : null;
    navigate(user ? routeForRole(user.role) : '/login', { replace: true });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-base px-5 font-body">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-card p-8">
          {!forced && (
            <Link
              to="/perfil"
              className="mb-4 inline-block text-xs uppercase text-accent transition hover:opacity-80"
            >
              &larr; Voltar
            </Link>
          )}

          <h1 className="font-title text-2xl uppercase tracking-wider text-text-primary">
            Autenticação em duas etapas
          </h1>

          {forced && (
            <p className="mt-4 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-xs text-accent">
              Contas de administrador exigem 2FA. Configure para continuar.
            </p>
          )}

          {step === 'loading' && (
            <p className="mt-6 text-sm text-text-secondary">Gerando QR code...</p>
          )}

          {step === 'scan' && (
            <>
              <p className="mt-6 text-sm text-text-secondary">
                Escaneie o QR code com um app autenticador (Google Authenticator, Authy, etc), ou
                digite o código manualmente.
              </p>

              {qrCodeDataUrl && (
                <img
                  src={qrCodeDataUrl}
                  alt="QR code para configurar 2FA"
                  className="mx-auto mt-6 h-48 w-48 rounded-lg bg-white p-2"
                />
              )}

              <p className="mt-4 break-all rounded-lg border border-border bg-base px-3 py-2 text-center text-xs text-text-secondary">
                {secret}
              </p>

              <form onSubmit={handleConfirm} className="mt-6">
                <label className="block space-y-2">
                  <span className="text-xs uppercase text-text-secondary">Código de 6 dígitos</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value.trim())}
                    className="h-12 w-full rounded-lg border border-border bg-base px-3 text-center text-lg tracking-widest text-text-primary outline-none focus:border-accent"
                    required
                  />
                </label>

                {error && (
                  <p role="alert" className="mt-5 rounded-lg border border-border px-4 py-3 text-sm text-accent">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={confirming}
                  className="mt-6 block min-h-12 w-full rounded-lg bg-accent px-5 font-bold uppercase text-black transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
                >
                  {confirming ? 'Confirmando...' : 'Ativar 2FA'}
                </button>
              </form>
            </>
          )}

          {step === 'done' && (
            <>
              <p className="mt-6 rounded-lg border border-border px-4 py-3 text-sm text-text-secondary">
                2FA ativado com sucesso! Guarde estes códigos de backup em um local seguro — cada um
                só pode ser usado uma vez, e eles não serão mostrados novamente.
              </p>

              <ul className="mt-4 grid grid-cols-2 gap-2">
                {backupCodes.map((backupCode) => (
                  <li
                    key={backupCode}
                    className="rounded-lg border border-border bg-base px-3 py-2 text-center font-mono text-xs text-text-primary"
                  >
                    {backupCode}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={handleFinish}
                className="mt-6 block min-h-12 w-full rounded-lg bg-accent px-5 font-bold uppercase text-black transition hover:opacity-90"
              >
                Continuar
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
