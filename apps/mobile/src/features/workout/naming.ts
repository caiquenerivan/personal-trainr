import type { Day, MyRoutine, RoutineExercise } from '@personaltrainr/shared';

// Mesmo nome do treino que o painel web mostra: descrição do dia definida
// pelo personal, senão os grupos musculares.
export function workoutName(routine: MyRoutine | null | undefined, day: Day): string {
  const description = routine?.dayDescriptions?.[day];
  if (description) return description.toUpperCase();
  const exercises = routine?.exercises[day] ?? [];
  if (exercises.length === 0) return 'DESCANSO OU CARDIO';
  const muscles = [...new Set(exercises.map((e) => e.exercise.muscle).filter(Boolean))];
  return muscles.length > 0 ? muscles.join(' & ').toUpperCase() : 'MUSCULAÇÃO';
}

export function workoutTitle(routine: MyRoutine | null | undefined, day: Day): string {
  return `TREINO ${day} - ${workoutName(routine, day)}`;
}

export function routineDays(routine: MyRoutine | null | undefined): Day[] {
  const letters = (routine?.type ?? 'ABCDE').split('') as Day[];
  return letters.filter((l): l is Day => ['A', 'B', 'C', 'D', 'E'].includes(l));
}

export function exercisesForDay(routine: MyRoutine | null | undefined, day: Day): RoutineExercise[] {
  return routine?.exercises[day] ?? [];
}

// A → B → C → A… dentro das letras da rotina; sem treino anterior, a primeira
// letra que tem exercícios.
export function nextDay(routine: MyRoutine | null | undefined, last: Day | null): Day {
  const days = routineDays(routine);
  if (last && days.includes(last)) return days[(days.indexOf(last) + 1) % days.length];
  return days.find((d) => exercisesForDay(routine, d).length > 0) ?? days[0] ?? 'A';
}
