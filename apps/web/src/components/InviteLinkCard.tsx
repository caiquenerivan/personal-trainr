import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Link2, Share2 } from 'lucide-react';

export function inviteUrl(username: string): string {
  return `${window.location.origin}/convite/${encodeURIComponent(username)}`;
}

// Link que o personal manda para o aluno: abre /convite/:username, onde o
// aluno cria a conta (ou entra) e já fica vinculado ao personal.
export function InviteLinkCard({ username }: { username: string | null | undefined }) {
  const [copied, setCopied] = useState(false);

  if (!username) {
    return (
      <div className="rounded-xl border border-border/40 bg-card p-5">
        <div className="flex items-center gap-2">
          <Link2 size={16} className="text-accent" />
          <h3 className="font-body text-sm font-bold uppercase tracking-wider text-text-primary">Link de convite</h3>
        </div>
        <p className="mt-2 font-body text-sm text-text-secondary">
          Defina um username no <Link to="/perfil" className="text-accent underline">seu perfil</Link> para gerar o link que você manda aos alunos.
        </p>
      </div>
    );
  }

  const url = inviteUrl(username);
  const message = `Treine comigo no Personal Trainr! Crie sua conta pelo link: ${url}`;
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // navegador sem permissão de clipboard: o link continua visível para copiar à mão
    }
  }

  async function share() {
    try {
      await navigator.share({ title: 'Personal Trainr', text: message, url });
    } catch {
      // usuário cancelou o compartilhamento
    }
  }

  return (
    <div className="rounded-xl border border-accent/40 bg-card p-5">
      <div className="flex items-center gap-2">
        <Link2 size={16} className="text-accent" />
        <h3 className="font-body text-sm font-bold uppercase tracking-wider text-text-primary">Link de convite</h3>
      </div>
      <p className="mt-1 font-body text-xs text-text-secondary">
        Mande para seus alunos: ao criar a conta por ele, o aluno já fica vinculado a você.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Link de convite"
          className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-base px-3 font-body text-sm text-text-primary outline-none focus:border-accent"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-xs font-bold uppercase tracking-wider text-black transition hover:opacity-90 active:scale-95 sm:flex-none"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
          {canShare ? (
            <button
              type="button"
              onClick={share}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 text-xs font-bold uppercase tracking-wider text-text-primary transition hover:bg-white/5 active:scale-95 sm:flex-none"
            >
              <Share2 size={14} />
              Compartilhar
            </button>
          ) : (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 text-xs font-bold uppercase tracking-wider text-text-primary transition hover:bg-white/5 active:scale-95 sm:flex-none"
            >
              <Share2 size={14} />
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
