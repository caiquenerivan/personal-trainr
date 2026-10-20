import { useState } from 'react';
import { userGet, userRemove, userSet } from '../utils/userStorage';

type RoutineLike = {
  id: string;
  type?: string;
  exercises?: Record<string, Array<{ id: string; exercise?: { id: string } }>>;
};

type LogLike = { routineExerciseId?: string | null; exerciseId?: string | null; completedAt: string };

type Saved = {
  routineId: string;
  letter: string;
  checked: Record<string, boolean>;
  weights: Record<string, string>;
  updatedAt: number;
};

const KEY = 'activeWorkout';
// Treino marcado e não finalizado há mais que isso é de outro dia: começa de
// novo (as cargas digitadas ficam, como referência da última vez).
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

export function routineLetters(routine: RoutineLike | null | undefined): string[] {
  return routine?.type?.split('') ?? ['A', 'B', 'C', 'D', 'E'];
}

// Letra seguinte à do treino mais recente do histórico (A → B → C → A…).
// Sem histórico desta rotina, a primeira letra que tem exercícios.
export function nextLetter(routine: RoutineLike, logs: LogLike[]): string {
  const letters = routineLetters(routine);
  const byRoutineExercise = new Map<string, string>();
  const byExercise = new Map<string, string>();
  for (const [day, exercises] of Object.entries(routine.exercises ?? {})) {
    for (const re of exercises ?? []) {
      byRoutineExercise.set(re.id, day);
      if (re.exercise?.id && !byExercise.has(re.exercise.id)) byExercise.set(re.exercise.id, day);
    }
  }
  const latest = [...logs]
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
    .map((log) => (log.routineExerciseId && byRoutineExercise.get(log.routineExerciseId)) || (log.exerciseId && byExercise.get(log.exerciseId)))
    .find((day): day is string => !!day);
  if (latest && letters.includes(latest)) {
    return letters[(letters.indexOf(latest) + 1) % letters.length];
  }
  return letters.find((l) => (routine.exercises?.[l]?.length ?? 0) > 0) ?? letters[0];
}

function read(): Saved | null {
  try {
    const raw = userGet(KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

// Treino em andamento (letra, exercícios marcados e cargas) guardado no
// navegador: recarregar a página ou sair dela não perde o que foi feito.
export function useActiveWorkout() {
  const [state, setState] = useState<Saved | null>(null);

  function save(next: Saved) {
    userSet(KEY, JSON.stringify(next));
    setState(next);
  }

  // a partir do estado mais recente: dois toques seguidos não se perdem
  function update(patch: (prev: Saved) => Partial<Saved>) {
    setState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch(prev), updatedAt: Date.now() };
      userSet(KEY, JSON.stringify(next));
      return next;
    });
  }

  return {
    letter: state?.letter ?? 'A',
    checked: state?.checked ?? {},
    weights: state?.weights ?? {},

    // Chamado ao carregar a rotina e o histórico.
    restore(routine: RoutineLike, logs: LogLike[]) {
      const saved = read();
      if (saved && saved.routineId === routine.id && Date.now() - saved.updatedAt < MAX_AGE_MS) {
        setState(saved);
        return;
      }
      const sameRoutine = saved?.routineId === routine.id;
      save({
        routineId: routine.id,
        letter: nextLetter(routine, logs),
        checked: {},
        weights: sameRoutine ? saved!.weights : {},
        updatedAt: Date.now(),
      });
    },

    selectLetter(letter: string) {
      update(() => ({ letter }));
    },

    toggle(id: string) {
      update((prev) => ({ checked: { ...prev.checked, [id]: !prev.checked[id] } }));
    },

    setWeight(id: string, value: string) {
      update((prev) => ({ weights: { ...prev.weights, [id]: value } }));
    },

    // Depois de finalizar: limpa as marcações, mantém as cargas e já deixa
    // selecionada a próxima letra.
    finish(routine: RoutineLike) {
      const letters = routineLetters(routine);
      update((prev) => ({ checked: {}, letter: letters[(letters.indexOf(prev.letter) + 1) % letters.length] }));
    },

    clear() {
      userRemove(KEY);
      setState(null);
    },
  };
}
