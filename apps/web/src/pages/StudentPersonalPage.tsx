import { useEffect, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { listAllTrainers, getMyTrainers, createConnection, removeConnection } from '../api/connections';
import {
  User, Search, ShieldCheck, MessageCircle, X,
  Phone, Globe, Camera, Trash2, Hash, MapPin,
} from 'lucide-react';

type SearchResult = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  especialidades: string | null;
};

type LinkedTrainer = {
  connectionId: string;
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  phone: string | null;
  instagram: string | null;
  bio: string | null;
  cref: string | null;
  crefState: string | null;
  website: string | null;
  especialidades: string | null;
};

function toInstagramUrl(value: string): string {
  const clean = value.replace(/^@/, '').trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  return `https://instagram.com/${clean}`;
}

function parseSpecialties(val: string | null): string[] {
  if (!val) return [];
  return val.split(',').map((s) => s.trim()).filter(Boolean);
}

export function StudentPersonalPage() {
  const [hasLinkedTrainer, setHasLinkedTrainer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [linkedTrainer, setLinkedTrainer] = useState<LinkedTrainer | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [allTrainers, setAllTrainers] = useState<SearchResult[]>([]);
  const [trainersLoading, setTrainersLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  function refetchMyTrainers() {
    getMyTrainers()
      .then((data) => {
        const trainers = data.trainers ?? [];
        if (trainers.length > 0) {
          setHasLinkedTrainer(true);
          setLinkedTrainer(trainers[0]);
        } else {
          setHasLinkedTrainer(false);
          setLinkedTrainer(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setHasLinkedTrainer(false);
        setLinkedTrainer(null);
        setLoading(false);
      });
  }

  useEffect(() => {
    refetchMyTrainers();
  }, []);

  useEffect(() => {
    if (hasLinkedTrainer) return;
    setTrainersLoading(true);
    listAllTrainers()
      .then((data) => setAllTrainers(data.trainers ?? []))
      .catch(() => setAllTrainers([]))
      .finally(() => setTrainersLoading(false));
  }, [hasLinkedTrainer]);

  const filteredResults = searchQuery.trim()
    ? allTrainers.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
          t.username?.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : allTrainers;

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  function handleConnect(trainerId: string, trainerName: string) {
    createConnection(trainerId)
      .then(() => {
        showToast('Personal vinculado com sucesso!');
        refetchMyTrainers();
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof AxiosError
            ? err.response?.data?.message || 'Erro ao conectar'
            : 'Erro ao conectar';
        showToast(msg);
      });
  }

  function handleRemove(connectionId: string) {
    removeConnection(connectionId)
      .then(() => {
        showToast('Conexão removida com sucesso');
        refetchMyTrainers();
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof AxiosError
            ? err.response?.data?.message || 'Erro ao remover'
            : 'Erro ao remover';
        showToast(msg);
      });
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl">
        <p className="font-body text-text-secondary">Carregando informações...</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
      {toast && (
        <div className="fixed right-4 top-4 z-50 flex items-center gap-3 rounded-xl border border-accent/40 bg-card px-5 py-3 shadow-lg shadow-black/40 animate-slide-up">
          <span className="font-body text-sm text-text-primary">{toast}</span>
          <button onClick={() => setToast(null)} className="text-text-secondary hover:text-text-primary">
            <X size={16} />
          </button>
        </div>
      )}

      <h1 className="font-title text-3xl uppercase tracking-wider text-text-primary">
        Meu Personal
      </h1>

      {hasLinkedTrainer && linkedTrainer ? (
        <div className="mt-8 max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-accent/50 hover:shadow-[0_0_28px_rgba(175,145,80,0.3)] md:p-8">
          {/* Header */}
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-accent bg-base text-4xl font-bold uppercase text-accent">
              {linkedTrainer.avatarUrl ? (
                <img src={linkedTrainer.avatarUrl} alt={linkedTrainer.name} className="h-full w-full object-cover" />
              ) : (
                linkedTrainer.name.charAt(0)
              )}
            </div>

            <div className="flex-1 space-y-2">
              <span className="inline-block rounded-full border border-accent/30 bg-accent/20 px-3 py-1 text-xs font-semibold uppercase text-accent">
                Profissional Ativo
              </span>
              <h2 className="font-title text-2xl uppercase tracking-wide text-text-primary">
                {linkedTrainer.name}
              </h2>
              {linkedTrainer.username && (
                <p className="font-body text-sm text-text-secondary">@{linkedTrainer.username}</p>
              )}
            </div>
          </div>

          {/* Info rows */}
          <div className="mt-6 space-y-3">
            {linkedTrainer.cref && (
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <Hash size={16} className="shrink-0 text-accent" />
                <span>
                  CREF: <strong className="text-text-primary">{linkedTrainer.cref}</strong>
                  {linkedTrainer.crefState && <span> — {linkedTrainer.crefState}</span>}
                </span>
              </div>
            )}

            {parseSpecialties(linkedTrainer.especialidades).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {parseSpecialties(linkedTrainer.especialidades).map((spec) => (
                  <span key={spec} className="rounded bg-base px-2 py-0.5 text-[10px] font-semibold uppercase text-text-primary border border-border/40">
                    {spec}
                  </span>
                ))}
              </div>
            )}

            {linkedTrainer.bio && (
              <p className="font-body text-sm leading-relaxed text-text-secondary">{linkedTrainer.bio}</p>
            )}

            {linkedTrainer.phone && (
              <a
                href={`https://wa.me/${linkedTrainer.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-text-secondary hover:text-accent transition-colors"
              >
                <Phone size={16} className="shrink-0 text-accent" />
                {linkedTrainer.phone}
              </a>
            )}

            {linkedTrainer.instagram && (
              <a
                href={toInstagramUrl(linkedTrainer.instagram)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-text-secondary hover:text-accent transition-colors"
              >
                <Camera size={16} className="shrink-0 text-accent" />
                {linkedTrainer.instagram}
              </a>
            )}

            {linkedTrainer.website && (
              <a
                href={linkedTrainer.website.startsWith('http') ? linkedTrainer.website : `https://${linkedTrainer.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-text-secondary hover:text-accent transition-colors"
              >
                <Globe size={16} className="shrink-0 text-accent" />
                {linkedTrainer.website}
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 grid gap-4 border-t border-border/60 pt-6 sm:grid-cols-2">
            <a
              href={
                linkedTrainer.phone
                  ? `https://wa.me/${linkedTrainer.phone.replace(/\D/g, '')}?text=Olá,%20gostaria%20de%20ajuste%20no%20meu%20treino!`
                  : '#'
              }
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-3 rounded-xl px-6 py-4 font-body text-sm font-bold uppercase transition active:scale-95 ${
                linkedTrainer.phone
                  ? 'bg-accent text-black hover:opacity-90'
                  : 'cursor-not-allowed border border-border bg-base text-text-secondary/50'
              }`}
            >
              <MessageCircle size={18} />
              Enviar Mensagem
            </a>
            <button
              onClick={() => handleRemove(linkedTrainer.connectionId)}
              className="flex items-center justify-center gap-3 rounded-xl border border-red-500/50 bg-red-500/10 px-6 py-4 font-body text-sm font-bold uppercase text-red-400 transition hover:bg-red-500/20 active:scale-95"
            >
              <Trash2 size={18} />
              Remover Conexão
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <div className="mx-auto max-w-4xl rounded-2xl border border-border/80 bg-card p-6 text-center shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-accent/50 hover:shadow-[0_0_28px_rgba(175,145,80,0.3)] md:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
              <User size={28} />
            </div>
            <h2 className="mt-4 font-title text-xl uppercase tracking-wide text-text-primary">
              Nenhum Personal Vinculado
            </h2>
            <p className="mx-auto mt-2 max-w-xl font-body text-sm leading-relaxed text-text-secondary">
              Você não possui nenhum personal trainer vinculado à sua conta no
              momento. Escolha um profissional abaixo para começar.
            </p>
          </div>

          <div className="relative mt-8">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-accent"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar por nome ou @username..."
              className="h-12 w-full rounded-xl border border-border bg-base pl-11 pr-4 font-body text-sm text-text-primary outline-none placeholder:text-text-secondary/50 focus:border-accent"
            />
          </div>

          {trainersLoading && (
            <p className="mt-6 font-body text-sm text-text-secondary">Carregando personais...</p>
          )}

          {!trainersLoading && filteredResults.length === 0 && (
            <p className="mt-6 font-body text-sm text-text-secondary">
              {searchQuery.trim()
                ? `Nenhum personal encontrado para "${searchQuery.trim()}"`
                : 'Nenhum personal disponível no momento.'}
            </p>
          )}

          {!trainersLoading && filteredResults.length > 0 && (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredResults.map((trainer) => (
                <div
                  key={trainer.id}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-accent/50 hover:shadow-[0_0_28px_rgba(175,145,80,0.3)]"
                >
                  <div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-accent bg-base">
                        {trainer.avatarUrl ? (
                          <img src={trainer.avatarUrl} alt={trainer.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold uppercase text-accent">{trainer.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-title text-lg uppercase tracking-wide text-text-primary">{trainer.name}</h3>
                        <p className="mt-0.5 truncate text-xs text-text-secondary">@{trainer.username}</p>
                      </div>
                    </div>

                    {parseSpecialties(trainer.especialidades).length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {parseSpecialties(trainer.especialidades).map((spec) => (
                          <span key={spec} className="rounded bg-base px-2 py-0.5 text-[10px] font-semibold uppercase text-text-primary border border-border/40">
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}

                    {trainer.bio && (
                      <p className="mt-4 line-clamp-3 font-body text-sm leading-relaxed text-text-secondary">{trainer.bio}</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleConnect(trainer.id, trainer.name)}
                    className="mt-6 flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3 text-xs font-bold uppercase text-black transition hover:opacity-90 active:scale-[0.98]"
                  >
                    CONECTAR
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
