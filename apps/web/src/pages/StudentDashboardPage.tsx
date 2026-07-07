import { useEffect, useState } from 'react';
import { getMyRoutine, completeExercise, getWorkoutHistory } from '../api/student';
import { Modal } from '../components/Modal';
import {
  Flame,
  Target,
  Scale,
  Ruler,
  CheckSquare,
  Square,
  Sparkles,
  Trophy,
  Activity,
  AlertCircle
} from 'lucide-react';

type ExerciseDetail = {
  id: string;
  name: string;
  series: number;
  reps: number;
  restTime: number;
  exercise: {
    id: string;
    name: string;
    videoUrl?: string | null;
    gifUrl?: string | null;
    muscle?: string | null;
    observations?: string | null;
  };
};

type RoutineData = {
  id: string;
  name: string;
  type: string;
  trainerId: string;
  expiresAt: string;
  exercises: Record<string, ExerciseDetail[]>;
};

type WorkoutSession = {
  id: string;
  title: string;
  duration: string;
  completedAt: string;
};

const defaultMockHistory: WorkoutSession[] = [
  {
    id: 'mock-1',
    title: 'TREINO A - PEITO E TRÍCEPS',
    duration: '45 min',
    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2).toISOString(),
  },
  {
    id: 'mock-2',
    title: 'TREINO B - COSTAS E BÍCEPS',
    duration: '50 min',
    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function StudentDashboardPage() {
  const [routine, setRoutine] = useState<RoutineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dashboard states
  const [selectedLetter, setSelectedLetter] = useState('A');
  const [streak, setStreak] = useState(5);
  const [objective, setObjective] = useState('Hipertrofia');
  const [weight, setWeight] = useState('—');
  const [height, setHeight] = useState('—');
  const [userName, setUserName] = useState('Aluno');
  
  // Workout execution states
  const [checkedExercises, setCheckedExercises] = useState<Record<string, boolean>>({});
  const [weightsUsed, setWeightsUsed] = useState<Record<string, string>>({});
  const [detailTarget, setDetailTarget] = useState<ExerciseDetail | null>(null);
  const [finishingWorkout, setFinishingWorkout] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedWorkoutTitle, setCompletedWorkoutTitle] = useState('');
  
  // History states
  const [historyList, setHistoryList] = useState<WorkoutSession[]>([]);

  // Load and sync dashboard information
  const loadData = async () => {
    try {
      // 1. Load User information
      const userRaw = window.localStorage.getItem('personaltrainr.user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        setUserName(user.name ?? 'Aluno');
        setWeight(user.weight ? `${user.weight} kg` : '—');
        setHeight(user.height ? `${user.height} cm` : '—');
      }

      // 2. Load Streak & Objective from local storage
      const storedStreak = window.localStorage.getItem('personaltrainr.streak');
      if (storedStreak) {
        setStreak(Number(storedStreak));
      } else {
        window.localStorage.setItem('personaltrainr.streak', '5');
        setStreak(5);
      }

      const storedObjective = window.localStorage.getItem('personaltrainr.objective');
      if (storedObjective) {
        setObjective(storedObjective);
      } else {
        window.localStorage.setItem('personaltrainr.objective', 'Hipertrofia');
        setObjective('Hipertrofia');
      }

      // 3. Fetch Active Routine
      const activeRoutine = await getMyRoutine();
      setRoutine(activeRoutine);

      // 4. Fetch Backend history
      let backendLogs: any[] = [];
      try {
        const res = await getWorkoutHistory();
        backendLogs = res.logs ?? [];
      } catch (err) {
        console.warn('Failed to load backend workout history logs', err);
      }

      // 5. Build premium history view
      const enrichedHistory = enrichHistoryList(backendLogs, activeRoutine);
      setHistoryList(enrichedHistory);
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Nenhuma rotina ativa vinculada. Peça ao seu personal trainer para atribuir um treino.');
      setLoading(false);
      
      // Still show mock history even if routine loading fails
      const enrichedHistory = enrichHistoryList([], null);
      setHistoryList(enrichedHistory);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper to compile backend logs and localStorage history
  const enrichHistoryList = (backendLogs: any[], activeRoutine: any): WorkoutSession[] => {
    const localHistoryRaw = window.localStorage.getItem('personaltrainr.localHistory');
    let localHistory = localHistoryRaw ? JSON.parse(localHistoryRaw) : [];
    
    if (localHistory.length === 0) {
      window.localStorage.setItem('personaltrainr.localHistory', JSON.stringify(defaultMockHistory));
      localHistory = [...defaultMockHistory];
    }

    const sessionsFromLogs: WorkoutSession[] = [];
    const logsByDate: Record<string, any[]> = {};
    
    backendLogs.forEach(log => {
      const dateKey = new Date(log.completedAt).toDateString();
      if (!logsByDate[dateKey]) {
        logsByDate[dateKey] = [];
      }
      logsByDate[dateKey].push(log);
    });

    Object.entries(logsByDate).forEach(([dateKey, dayLogs]) => {
      let workoutLetter = 'A';
      let workoutName = 'Geral';
      
      if (activeRoutine && activeRoutine.exercises) {
        for (const [day, exercises] of Object.entries(activeRoutine.exercises)) {
          const match = (exercises as any[]).find(e => e.id === dayLogs[0].routineExerciseId);
          if (match) {
            workoutLetter = day;
            const muscles = Array.from(
              new Set((exercises as any[]).map(e => e.exercise.muscle).filter(Boolean))
            );
            workoutName = muscles.length > 0 ? muscles.join(' & ') : 'Musculação';
            break;
          }
        }
      }
      
      const alreadyInLocal = localHistory.some(
        (h: any) => new Date(h.completedAt).toDateString() === dateKey
      );
      if (!alreadyInLocal) {
        sessionsFromLogs.push({
          id: `log-session-${dateKey}`,
          title: `TREINO ${workoutLetter} - ${workoutName.toUpperCase()}`,
          duration: '45 min',
          completedAt: dayLogs[0].completedAt,
        });
      }
    });

    const combined = [...localHistory, ...sessionsFromLogs];
    return combined.sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  };

  // Get current workout details
  const getWorkoutExercises = () => {
    if (!routine || !routine.exercises) return [];
    return routine.exercises[selectedLetter] ?? [];
  };

  const getWorkoutName = (letter: string, exercises: ExerciseDetail[]) => {
    if (exercises.length === 0) return 'Descanso ou Cardio';
    const muscles = Array.from(
      new Set(exercises.map(e => e.exercise.muscle).filter(Boolean))
    );
    return muscles.length > 0 ? muscles.join(' & ').toUpperCase() : 'MUSCULAÇÃO';
  };

  const activeExercises = getWorkoutExercises();
  const activeWorkoutName = getWorkoutName(selectedLetter, activeExercises);

  // Toggle checklist exercise
  const handleToggleCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening detail modal
    setCheckedExercises(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleWeightChange = (id: string, value: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setWeightsUsed(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Calculate Progress
  const totalExercises = activeExercises.length;
  const completedCount = activeExercises.filter(e => checkedExercises[e.id]).length;
  const progressPercentage = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  // Finalize Workout Handler
  const handleFinalizeWorkout = async () => {
    if (activeExercises.length === 0) return;
    setFinishingWorkout(true);

    try {
      // 1. Submit completed exercises to backend logs
      const completedExercises = activeExercises.filter(e => checkedExercises[e.id]);
      const targetExercises = completedExercises.length > 0 ? completedExercises : activeExercises;

      const apiCalls = targetExercises.map(ex => {
        const weightValue = weightsUsed[ex.id] ? parseFloat(weightsUsed[ex.id]) : null;
        return completeExercise(ex.id, weightValue);
      });

      await Promise.all(apiCalls);

      // 2. Increment Streak
      const newStreak = streak + 1;
      setStreak(newStreak);
      window.localStorage.setItem('personaltrainr.streak', String(newStreak));

      // 3. Save session to local history
      const formattedTitle = `TREINO ${selectedLetter} - ${activeWorkoutName}`;
      const newSession: WorkoutSession = {
        id: `local-session-${Date.now()}`,
        title: formattedTitle,
        duration: `${35 + Math.floor(Math.random() * 25)} min`,
        completedAt: new Date().toISOString(),
      };

      const localHistoryRaw = window.localStorage.getItem('personaltrainr.localHistory');
      const localHistory = localHistoryRaw ? JSON.parse(localHistoryRaw) : [];
      const updatedLocalHistory = [newSession, ...localHistory];
      window.localStorage.setItem('personaltrainr.localHistory', JSON.stringify(updatedLocalHistory));

      // 4. Update UI state
      setCompletedWorkoutTitle(formattedTitle);
      setShowCelebration(true);
      setCheckedExercises({});
      setWeightsUsed({});
      
      // Reload history list
      await loadData();
    } catch (err) {
      console.error('Error finalizing workout:', err);
    } finally {
      setFinishingWorkout(false);
    }
  };

  // Format date helper for calendar card
  const getCalendarDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const month = months[d.getMonth()] || 'OUT';
    const day = String(d.getDate()).padStart(2, '0');
    return { day, month };
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8">
        <p className="font-body text-text-secondary text-center animate-pulse">Carregando painel do aluno...</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8 space-y-8">
      {/* Top Welcome Title */}
      <div className="flex items-center justify-between border-b border-border/20 pb-4">
        <div>
          <h1 className="font-title text-3xl sm:text-4xl uppercase tracking-wider text-text-primary">
            OLÁ {userName.split(' ')[0]}!
          </h1>
          <p className="font-body text-xs text-text-secondary mt-1 uppercase tracking-wide">
            BOM TRABALHO HOJE. VAMOS AOS TREINOS!
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-accent/10 border border-accent/20 px-4 py-2 text-accent">
          <Sparkles size={16} />
          <span className="font-body text-xs font-bold uppercase">Aluno Ouro</span>
        </div>
      </div>

      {/* Grid of 4 Small Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="rounded-xl bg-[#262626] border border-border/40 p-4 flex items-center gap-4 transition duration-300 hover:border-accent/30">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-600/10 text-orange-400">
            <Flame size={24} className="fill-orange-400/20" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-text-secondary">Streak</span>
            <span className="font-number text-2xl text-accent font-bold">{streak}</span>
            <span className="text-[10px] text-text-secondary ml-1 font-body">dias</span>
          </div>
        </div>

        {/* Objetivo */}
        <div className="rounded-xl bg-[#262626] border border-border/40 p-4 flex items-center gap-4 transition duration-300 hover:border-accent/30">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Target size={24} />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-text-secondary">Objetivo</span>
            <span className="font-body text-sm font-bold text-text-primary uppercase tracking-wide truncate max-w-[100px] block">
              {objective}
            </span>
          </div>
        </div>

        {/* Peso */}
        <div className="rounded-xl bg-[#262626] border border-border/40 p-4 flex items-center gap-4 transition duration-300 hover:border-accent/30">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400">
            <Scale size={24} />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-text-secondary">Peso</span>
            <span className="font-number text-xl text-accent font-bold">{weight}</span>
          </div>
        </div>

        {/* Altura */}
        <div className="rounded-xl bg-[#262626] border border-border/40 p-4 flex items-center gap-4 transition duration-300 hover:border-accent/30">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-600/10 text-green-400">
            <Ruler size={24} />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-text-secondary">Altura</span>
            <span className="font-number text-xl text-accent font-bold">{height}</span>
          </div>
        </div>
      </div>

      {/* Workout Selectors (A, B, C, D, E) */}
      <div className="space-y-3">
        <label className="block text-[11px] uppercase tracking-widest font-bold text-text-secondary">
          Selecione o Treino
        </label>
        <div className="flex gap-2 p-1 rounded-xl bg-black/20 border border-border/20 max-w-md">
          {['A', 'B', 'C', 'D', 'E'].map(letter => {
            const isSelected = selectedLetter === letter;
            const hasExercises = routine?.exercises?.[letter] && routine.exercises[letter].length > 0;
            return (
              <button
                key={letter}
                type="button"
                onClick={() => setSelectedLetter(letter)}
                className={`relative flex-1 py-3 text-center rounded-lg font-title text-base uppercase tracking-wider transition active:scale-95 ${
                  isSelected
                    ? 'bg-accent text-black font-extrabold shadow'
                    : 'text-text-secondary hover:text-text-primary hover:bg-base/30'
                }`}
              >
                {letter}
                {hasExercises && (
                  <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-black' : 'bg-accent'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Treino do Dia and Histórico */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 min-w-0">
        {/* Card: Treino do Dia (2 cols width on large screens) */}
        <div className="lg:col-span-2 rounded-2xl bg-[#262626] border border-border/60 p-4 sm:p-6 flex flex-col justify-between hover:border-accent/20 transition-all duration-300 min-w-0">
          <div>
            {/* Top Subtitle and Title */}
            <div className="border-b border-border/30 pb-4 mb-6">
              <span className="block font-body text-xs font-bold uppercase tracking-widest text-accent">
                TREINO DO DIA
              </span>
              <h2 className="font-title text-xl sm:text-2xl uppercase tracking-wide text-text-primary mt-1">
                TREINO {selectedLetter} - {activeWorkoutName}
              </h2>
            </div>

            {/* Visual Progress Bar */}
            {activeExercises.length > 0 && (
              <div className="mb-6 space-y-2">
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span className="font-body">Progresso do Treino</span>
                  <span className="font-number font-bold text-accent">{progressPercentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-base overflow-hidden border border-border/40">
                  <div
                    className="h-full bg-accent transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Exercise List */}
            {activeExercises.length > 0 ? (
              <div className="space-y-3 mb-8">
                {activeExercises.map(item => {
                  const isChecked = !!checkedExercises[item.id];
                  return (
                    <div
                      key={item.id}
                      onClick={() => setDetailTarget(item)}
                      className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition hover:border-accent/40 ${
                        isChecked
                          ? 'border-accent/30 bg-accent/5'
                          : 'border-border/40 bg-base/40 hover:bg-base/60'
                      }`}
                    >
                      {/* Checkbox square */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleCheck(item.id, e)}
                        className={`shrink-0 flex items-center justify-center p-1 rounded-md transition ${
                          isChecked ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare size={22} className="fill-accent/10" />
                        ) : (
                          <Square size={22} />
                        )}
                      </button>

                      {/* Middle Exercise Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-body text-sm font-semibold uppercase tracking-wide truncate ${
                          isChecked ? 'text-text-secondary line-through' : 'text-text-primary'
                        }`}>
                          {item.exercise.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary mt-1">
                          <span className="font-number text-accent/80 font-bold">{item.series}x</span>
                          <span className="font-number text-accent/80 font-bold">{item.reps} reps</span>
                          <span className="text-[10px] bg-black/20 border border-border/30 rounded px-1.5 py-0.5">
                            Descanso: {item.restTime}s
                          </span>
                        </div>
                      </div>

                      {/* Weight input on row */}
                      <div className="hidden sm:block shrink-0" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={weightsUsed[item.id] ?? ''}
                          onChange={(e) => handleWeightChange(item.id, e.target.value, e)}
                          placeholder="Carga"
                          className="w-16 sm:w-20 rounded-lg border border-border bg-base px-2 py-2 text-xs text-text-primary text-center font-number outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-base/20 p-8 text-center my-8">
                <AlertCircle size={24} className="mx-auto text-text-secondary mb-3 animate-pulse" />
                <p className="font-body text-sm text-text-secondary">
                  Nenhum exercício cadastrado para o Treino {selectedLetter}.
                </p>
                <p className="text-xs text-text-secondary/70 mt-1">
                  Selecione outra letra acima ou consulte seu personal.
                </p>
              </div>
            )}
          </div>

          {/* Action button to Finalize Workout */}
          {activeExercises.length > 0 && (
            <button
              type="button"
              disabled={finishingWorkout}
              onClick={handleFinalizeWorkout}
              className="mt-6 flex w-full min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 font-body text-sm font-bold uppercase text-black transition hover:opacity-90 active:scale-98 disabled:opacity-50 disabled:cursor-wait"
            >
              <Trophy size={16} />
              {finishingWorkout ? 'Finalizando...' : 'Finalizar Treino'}
            </button>
          )}
        </div>

        {/* Card: Histórico (1 col width on large screens) */}
        <div className="rounded-2xl bg-[#262626] border border-border/60 p-4 sm:p-6 flex flex-col justify-between hover:border-accent/20 transition-all duration-300 min-w-0">
          <div>
            {/* Header Title & Completed Count */}
            <div className="flex items-center justify-between border-b border-border/30 pb-4 mb-6">
              <h2 className="font-title text-lg uppercase tracking-wide text-text-primary">
                HISTÓRICO
              </h2>
              <span className="font-number font-bold text-accent bg-base border border-border/60 px-3 py-1 rounded-full text-xs">
                {historyList.length} concluídos
              </span>
            </div>

            {/* History List */}
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {historyList.map(session => {
                const { day, month } = getCalendarDate(session.completedAt);
                return (
                  <div
                    key={session.id}
                    className="flex items-center gap-4 rounded-xl border border-border/40 bg-base/20 p-3 transition hover:border-border/80"
                  >
                    {/* Calendar Mini-card */}
                    <div className="flex flex-col items-center justify-center w-12 h-14 bg-base rounded border border-border/80 overflow-hidden shrink-0">
                      <div className="bg-[#333333] w-full text-center text-[9px] font-bold text-accent py-0.5 border-b border-border/60">
                        {month}
                      </div>
                      <div className="w-full bg-[#262626] text-center text-sm font-number font-bold text-text-primary py-1">
                        {day}
                      </div>
                    </div>

                    {/* Workout Name and Duration */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-body text-xs font-bold text-text-primary uppercase tracking-wide truncate">
                        {session.title}
                      </h4>
                      <p className="text-[10px] text-text-secondary mt-1 font-body flex items-center gap-1">
                        <Activity size={10} className="text-accent" />
                        Duração: {session.duration}
                      </p>
                    </div>

                    {/* Concluído Badge */}
                    <span className="shrink-0 border border-green-500/20 bg-green-500/5 text-green-400 px-2 py-1 rounded text-[9px] font-bold tracking-wider uppercase">
                      CONCLUÍDO
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Exercise Detail Modal */}
      <Modal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title="Detalhes do Exercício"
      >
        {detailTarget && (
          <div className="space-y-5">
            <div>
              <span className="text-[10px] uppercase font-bold text-accent tracking-widest">Exercício</span>
              <h3 className="font-title text-xl uppercase text-text-primary mt-1">
                {detailTarget.exercise.name}
              </h3>
              {detailTarget.exercise.muscle && (
                <span className="inline-block mt-2 rounded bg-base px-2.5 py-1 text-[10px] uppercase font-bold text-text-primary border border-border">
                  Grupo Muscular: {detailTarget.exercise.muscle}
                </span>
              )}
            </div>

            {detailTarget.exercise.gifUrl && (
              <div className="overflow-hidden rounded-xl bg-base border border-border/60 aspect-video flex items-center justify-center">
                <img
                  src={detailTarget.exercise.gifUrl}
                  alt={detailTarget.exercise.name}
                  className="max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {detailTarget.exercise.observations && (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest">Observações & Instruções</span>
                <p className="rounded-xl border border-border bg-base px-4 py-3 text-sm text-text-primary leading-relaxed">
                  {detailTarget.exercise.observations}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Celebration Modal after finishing workout */}
      <Modal
        open={showCelebration}
        onClose={() => setShowCelebration(false)}
        title="TREINO CONCLUÍDO!"
      >
        <div className="text-center py-6 space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 border border-accent/20 text-accent">
            <Trophy size={48} className="animate-bounce" />
          </div>

          <div className="space-y-2">
            <h3 className="font-title text-2xl uppercase tracking-wide text-text-primary">
              MUITO BEM!
            </h3>
            <p className="font-body text-sm text-accent font-bold uppercase tracking-wider">
              {completedWorkoutTitle}
            </p>
            <p className="font-body text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">
              "O esforço de hoje é o resultado de amanhã. Mantenha a constância e os resultados virão!"
            </p>
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={() => setShowCelebration(false)}
              className="w-full rounded-xl bg-accent px-6 py-3 font-body text-xs font-bold uppercase text-black transition hover:opacity-90 active:scale-95"
            >
              Continuar
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
