import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AssignRoutinePayload, ExercisePayload, RoutinePayload } from '@personaltrainr/shared';
import { trainerApi } from '../lib/api';
import { useAuth } from '../stores/auth';

// Chaves começam com 'trainer' + id do usuário (cache persistido por conta).
function useKey() {
  const userId = useAuth((s) => s.user?.id) ?? 'anon';
  return (...parts: unknown[]) => ['trainer', userId, ...parts];
}

export function useTrainerDashboard() {
  const key = useKey();
  return useQuery({ queryKey: key('dashboard'), queryFn: () => trainerApi.getDashboard(), retry: false });
}

export function useStudents() {
  const key = useKey();
  return useQuery({ queryKey: key('students'), queryFn: () => trainerApi.getStudents() });
}

export function useStudentsProgress() {
  const key = useKey();
  return useQuery({ queryKey: key('students-progress'), queryFn: () => trainerApi.getStudentsProgress(), retry: false });
}

export function useSubscription() {
  const key = useKey();
  return useQuery({ queryKey: key('subscription'), queryFn: () => trainerApi.getSubscription() });
}

export function useRoutines() {
  const key = useKey();
  return useQuery({ queryKey: key('routines'), queryFn: () => trainerApi.listRoutines() });
}

export function useRoutine(id: string | undefined) {
  const key = useKey();
  return useQuery({
    queryKey: key('routines', id),
    queryFn: () => trainerApi.getRoutine(id!),
    enabled: !!id,
  });
}

export function useExerciseCatalog() {
  const key = useKey();
  return useQuery({
    queryKey: key('exercises'),
    queryFn: () => trainerApi.listExercises(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useStudentLoadSummary(alunoId: string | undefined) {
  const key = useKey();
  return useQuery({
    queryKey: key('student-progress', alunoId),
    queryFn: () => trainerApi.getStudentLoadSummary(alunoId!),
    enabled: !!alunoId,
  });
}

export function useStudentExerciseLoadHistory(alunoId: string | undefined, exerciseId: string | null) {
  const key = useKey();
  return useQuery({
    queryKey: key('student-progress', alunoId, exerciseId),
    queryFn: () => trainerApi.getStudentExerciseLoadHistory(alunoId!, exerciseId!),
    enabled: !!alunoId && !!exerciseId,
  });
}

// Mutações invalidam tudo do personal e também o treino próprio (Meu Treino
// muda quando ele vincula uma rotina a si mesmo).
function useInvalidateTrainer() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['trainer'] }),
      queryClient.invalidateQueries({ queryKey: ['workout'] }),
    ]);
}

export function useSaveRoutine() {
  const invalidate = useInvalidateTrainer();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: RoutinePayload }) =>
      id ? trainerApi.updateRoutine(id, payload) : trainerApi.createRoutine(payload),
    onSuccess: invalidate,
  });
}

export function useDeleteRoutine() {
  const invalidate = useInvalidateTrainer();
  return useMutation({ mutationFn: (id: string) => trainerApi.deleteRoutine(id), onSuccess: invalidate });
}

export function useAssignRoutine() {
  const invalidate = useInvalidateTrainer();
  return useMutation({
    mutationFn: (payload: AssignRoutinePayload) => trainerApi.assignRoutine(payload),
    onSuccess: invalidate,
  });
}

export function useSaveExercise() {
  const invalidate = useInvalidateTrainer();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: ExercisePayload }) =>
      id ? trainerApi.updateExercise(id, payload) : trainerApi.createExercise(payload),
    onSuccess: invalidate,
  });
}

export function useDeleteExercise() {
  const invalidate = useInvalidateTrainer();
  return useMutation({ mutationFn: (id: string) => trainerApi.deleteExercise(id), onSuccess: invalidate });
}
