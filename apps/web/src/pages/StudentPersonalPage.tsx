import { useEffect, useState } from 'react';
import { getMyRoutine } from '../api/student';
import { User, MessageCircle, Star, ShieldCheck, Mail, Phone } from 'lucide-react';

type Trainer = {
  id: string;
  name: string;
  cref: string;
  email: string;
  phone: string;
  rating: number;
  experience: string;
  specialties: string[];
  bio: string;
};

const placeholderTrainers: Trainer[] = [
  {
    id: 'trainer-rodrigo',
    name: 'Rodrigo Santos',
    cref: '045928-G/SP',
    email: 'rodrigo.santos@fitnessgold.com',
    phone: '+55 (11) 98765-4321',
    rating: 4.9,
    experience: '8 anos de experiência',
    specialties: ['Hipertrofia', 'Definição Muscular', 'Periodização de Força'],
    bio: 'Especialista em musculação competitiva e transformações corporais aceleradas. Acredito que a consistência e a técnica correta superam o excesso de peso.',
  },
  {
    id: 'trainer-amanda',
    name: 'Amanda Costa',
    cref: '028471-G/RJ',
    email: 'amanda.costa@fitnessgold.com',
    phone: '+55 (21) 97654-3210',
    rating: 5.0,
    experience: '6 anos de experiência',
    specialties: ['Emagrecimento', 'Condicionamento Físico', 'Saúde & Longevidade'],
    bio: 'Foco na queima calórica otimizada, melhora cardiorrespiratória e mudança de hábitos alimentares. Treinos dinâmicos e adaptados para o seu dia a dia.',
  },
  {
    id: 'trainer-felipe',
    name: 'Felipe Neves',
    cref: '039182-G/DF',
    email: 'felipe.neves@fitnessgold.com',
    phone: '+55 (61) 96543-2109',
    rating: 4.8,
    experience: '10 anos de experiência',
    specialties: ['Treino Funcional', 'Reabilitação', 'Mobilidade & Flexibilidade'],
    bio: 'Fisioterapeuta e Personal Trainer focado em reabilitação de lesões, ganho de mobilidade articular e força funcional. Ideal para quem quer treinar sem dor.',
  },
];

export function StudentPersonalPage() {
  const [hasLinkedTrainer, setHasLinkedTrainer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [linkedTrainerName, setLinkedTrainerName] = useState('Seu Personal');

  useEffect(() => {
    getMyRoutine()
      .then((data) => {
        if (data && data.id) {
          setHasLinkedTrainer(true);
          // If we had the trainer's actual name we would use it, otherwise show a nice default
          if (data.trainerName) {
            setLinkedTrainerName(data.trainerName);
          } else {
            setLinkedTrainerName('Personal Trainer Gold Team');
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setHasLinkedTrainer(false);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl">
        <p className="font-body text-text-secondary">Carregando informações...</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
      <h1 className="font-title text-3xl uppercase tracking-wider text-text-primary">
        Meu Personal
      </h1>

      {hasLinkedTrainer ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 md:p-8 max-w-3xl">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-base text-4xl font-bold uppercase text-accent">
              {linkedTrainerName.charAt(0)}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold uppercase text-accent border border-accent/30">
                  Profissional Ativo
                </span>
              </div>
              <h2 className="font-title text-2xl uppercase tracking-wide text-text-primary">
                {linkedTrainerName}
              </h2>
              <p className="font-body text-sm text-text-secondary leading-relaxed">
                Este é o profissional responsável por montar, acompanhar e periodizar a sua rotina de treinos. 
                Se precisar de alterações de cargas, exercícios ou descanso, entre em contato diretamente.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 border-t border-border/60 pt-6 sm:grid-cols-2">
            <a
              href="https://wa.me/5511999999999?text=Olá,%20gostaria%20de%20ajuste%20no%20meu%20treino!"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 rounded-xl bg-accent px-6 py-4 font-body text-sm font-bold uppercase text-black transition hover:opacity-90 active:scale-95"
            >
              <MessageCircle size={18} />
              Enviar Mensagem
            </a>
            <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-base px-6 py-4 text-sm text-text-secondary">
              <ShieldCheck size={18} className="text-accent" />
              <span>Acompanhamento Ativo</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 mb-8 text-center max-w-4xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent mb-4">
              <User size={28} />
            </div>
            <h2 className="font-title text-xl uppercase tracking-wide text-text-primary">
              Nenhum Personal Vinculado
            </h2>
            <p className="mt-2 font-body text-sm text-text-secondary max-w-xl mx-auto leading-relaxed">
              Você não possui nenhum personal trainer vinculado à sua conta no momento. 
              Entre em contato com um dos profissionais do nosso time Gold abaixo para vincular uma rotina de treinos personalizada.
            </p>
          </div>

          <h2 className="font-title text-lg uppercase tracking-wide text-text-secondary mb-6">
            Profissionais Disponíveis
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl">
            {placeholderTrainers.map((trainer) => (
              <div
                key={trainer.id}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-accent/40 hover:shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-base text-lg font-bold uppercase text-text-secondary border border-border">
                      {trainer.name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-1 rounded bg-black/30 px-2 py-1 text-xs text-accent">
                      <Star size={12} className="fill-accent" />
                      <span className="font-number font-bold">{trainer.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <h3 className="mt-4 font-title text-lg uppercase tracking-wide text-text-primary">
                    {trainer.name}
                  </h3>
                  <p className="text-xs font-semibold text-accent/80 uppercase mt-0.5">
                    CREF {trainer.cref}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {trainer.experience}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {trainer.specialties.map((spec) => (
                      <span
                        key={spec}
                        className="rounded bg-base px-2 py-0.5 text-[10px] uppercase font-semibold text-text-primary border border-border/40"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  <p className="mt-4 font-body text-sm text-text-secondary leading-relaxed line-clamp-3">
                    {trainer.bio}
                  </p>
                </div>

                <div className="mt-6 space-y-2">
                  <a
                    href={`https://wa.me/${trainer.phone.replace(/[^0-9]/g, '')}?text=Olá%20${encodeURIComponent(trainer.name)},%20vi%20seu%20perfil%20no%20Personal%20Trainr%20e%20gostaria%20de%20saber%20mais!`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-xs font-bold uppercase text-black transition hover:opacity-90 active:scale-98"
                  >
                    <MessageCircle size={14} />
                    Contatar WhatsApp
                  </a>

                  <div className="flex flex-col gap-1 text-[11px] text-text-secondary border-t border-border/40 pt-3 mt-3">
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} className="text-accent" />
                      <span>{trainer.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="text-accent" />
                      <span>{trainer.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
