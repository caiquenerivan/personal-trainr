import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import type { MyRoutine } from '@personaltrainr/shared';
import { workoutApi } from '../lib/api';
import { useAuth } from '../stores/auth';

// Todas as chaves começam com 'workout' para a sincronização invalidar de uma
// vez, e levam o id do usuário para o cache persistido não misturar contas.
function useUserId() {
  return useAuth((s) => s.user?.id) ?? 'anon';
}

export function useMyRoutine() {
  const userId = useUserId();
  const query = useQuery({
    queryKey: ['workout', userId, 'routine'],
    queryFn: () => workoutApi.getMyRoutine(),
  });

  // Baixa as animações da rotina para o cache em disco: na academia sem
  // sinal elas continuam aparecendo.
  useEffect(() => {
    const urls = gifUrls(query.data);
    if (urls.length > 0) Image.prefetch(urls, 'disk').catch(() => {});
  }, [query.data]);

  return query;
}

function gifUrls(routine: MyRoutine | null | undefined): string[] {
  if (!routine) return [];
  const urls = Object.values(routine.exercises)
    .flat()
    .map((re) => re?.exercise.gifUrl)
    .filter((url): url is string => !!url);
  return [...new Set(urls)];
}

export function useDashboard() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['workout', userId, 'dashboard'],
    queryFn: () => workoutApi.getDashboard(),
  });
}

export function useWorkoutHistory() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['workout', userId, 'history'],
    queryFn: () => workoutApi.getHistory(),
  });
}

export function useLoadSummary(enabled = true) {
  const userId = useUserId();
  return useQuery({
    queryKey: ['workout', userId, 'progress'],
    queryFn: () => workoutApi.getLoadSummary(),
    enabled,
  });
}

export function useExerciseLoadHistory(exerciseId: string | null, enabled = true) {
  const userId = useUserId();
  return useQuery({
    queryKey: ['workout', userId, 'progress', exerciseId],
    queryFn: () => workoutApi.getExerciseLoadHistory(exerciseId!),
    enabled: enabled && !!exerciseId,
  });
}
