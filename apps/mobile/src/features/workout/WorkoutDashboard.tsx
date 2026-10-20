import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { AlertCircle, Flame, Ruler, Scale, Target, Trophy } from 'lucide-react-native';
import type { Day, RoutineExercise } from '@personaltrainr/shared';
import { useAuth } from '../../stores/auth';
import { useActiveWorkout, useActiveWorkoutStore } from '../../stores/activeWorkout';
import { useSyncStatus } from '../../stores/syncStatus';
import { useDashboard, useMyRoutine, useWorkoutHistory } from '../../hooks/useWorkoutData';
import { finishWorkout } from '../../lib/finishWorkout';
import { syncPendingLogs } from '../../lib/sync';
import { getLocalSessions, getPendingLogs } from '../../lib/workoutQueue';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { SyncBanner } from '../../components/SyncBanner';
import { Text } from '../../components/Text';
import { colors, fonts, radius } from '../../theme';
import { CelebrationModal } from './CelebrationModal';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { ExerciseRow } from './ExerciseRow';
import { HistoryCard } from './HistoryCard';
import { LetterSelector } from './LetterSelector';
import { RestTimer } from './RestTimer';
import { StatCard } from './StatCard';
import { buildHistory } from './history';
import { exercisesForDay, routineDays, workoutTitle } from './naming';

const KEEP_AWAKE_TAG = 'active-workout';

// Painel do aluno do web (/aluno/painel) adaptado ao app: treino do dia com
// execução offline e histórico. O personal usa o mesmo painel em "Meu Treino",
// sem os cards de perfil.
export function WorkoutDashboard({ variant }: { variant: 'student' | 'trainer' }) {
  const insets = useSafeAreaInsets();
  const user = useAuth((s) => s.user)!;
  const userId = user.id;

  const routineQuery = useMyRoutine();
  const dashboardQuery = useDashboard();
  const historyQuery = useWorkoutHistory();
  const routine = routineQuery.data;

  const workout = useActiveWorkout(userId);
  const { selectDay, toggle, setWeight, stopRest, reset } = useActiveWorkoutStore.getState();
  const syncStatus = useSyncStatus();

  const [detail, setDetail] = useState<RoutineExercise | null>(null);
  const [celebrated, setCelebrated] = useState<string | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const days = routineDays(routine);
  const day: Day = days.includes(workout.day) ? workout.day : (days[0] ?? 'A');
  const exercises = exercisesForDay(routine, day);
  const checkedCount = exercises.filter((e) => workout.checked[e.id]).length;
  const progress = exercises.length > 0 ? Math.round((checkedCount / exercises.length) * 100) : 0;

  // Tela acesa enquanto houver treino em andamento.
  useEffect(() => {
    if (!workout.startedAt) return;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [workout.startedAt]);

  // Recalculado a cada render: a fila e o diário locais não são reativos, e
  // quem força o render quando mudam é o syncStatus (envio) e o
  // historyVersion (treino finalizado).
  void historyVersion;
  const history = buildHistory({
    sessions: getLocalSessions(userId),
    serverLogs: historyQuery.data ?? [],
    pendingClientIds: new Set(getPendingLogs(userId).map((l) => l.clientId)),
    routine,
  });

  const handleToggle = (item: RoutineExercise) => toggle(userId, item.id, item.restTime);
  const handleWeight = (id: string, value: string) => setWeight(userId, id, value);
  const handleRestDone = () => stopRest(userId);

  function handleFinish() {
    const title = workoutTitle(routine, day);
    finishWorkout({ userId, day, title, exercises, workout });
    reset(userId);
    setHistoryVersion((v) => v + 1);
    setCelebrated(title);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.allSettled([
      syncPendingLogs(userId),
      routineQuery.refetch(),
      dashboardQuery.refetch(),
      historyQuery.refetch(),
    ]);
    setRefreshing(false);
  }

  const firstName = user.name.split(' ')[0];

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
      >
        {variant === 'student' ? (
          <View style={styles.welcome}>
            <Text variant="title" style={styles.greetingText}>
              Olá {firstName}!
            </Text>
            <Text style={styles.subtitle}>Bom trabalho hoje. Vamos aos treinos!</Text>
          </View>
        ) : (
          <View style={styles.welcome}>
            <Text variant="title" style={styles.greetingText}>
              Meu Treino
            </Text>
            <Text style={styles.subtitle}>Seu próprio treino, com a mesma execução dos alunos.</Text>
          </View>
        )}

        <SyncBanner />

        {variant === 'student' && (
          <View style={styles.stats}>
            <StatCard
              icon={Flame}
              color={colors.orange}
              label="Sequência Semanal"
              value={String(dashboardQuery.data?.weeklyStreak ?? 0)}
              unit={dashboardQuery.data?.weeklyStreak === 1 ? 'Semana' : 'Semanas'}
            />
            <StatCard icon={Target} color={colors.accent} label="Objetivo" value="Hipertrofia" numeric={false} />
            <StatCard icon={Scale} color={colors.blue} label="Peso" value={user.weight ? String(user.weight) : '—'} unit={user.weight ? 'kg' : undefined} />
            <StatCard icon={Ruler} color={colors.success} label="Altura" value={user.height ? String(user.height) : '—'} unit={user.height ? 'cm' : undefined} />
          </View>
        )}

        {routineQuery.isPending ? (
          <Text style={styles.loading}>Carregando treino...</Text>
        ) : !routine ? (
          <View style={styles.warning}>
            <Text style={styles.warningText}>
              {routineQuery.isError
                ? 'Não foi possível carregar sua rotina. Puxe para baixo para tentar de novo quando tiver internet.'
                : variant === 'student'
                  ? 'Nenhuma rotina ativa vinculada. Peça ao seu personal trainer para atribuir um treino.'
                  : 'Nenhuma rotina vinculada a você. Vincule uma rotina a si mesmo em Meu Treino no site.'}
            </Text>
          </View>
        ) : (
          <>
            <LetterSelector
              days={days}
              selected={day}
              hasExercises={(d) => exercisesForDay(routine, d).length > 0}
              onSelect={(d) => selectDay(userId, d)}
            />

            <Card style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <Text style={styles.eyebrow}>Treino do dia</Text>
                <Text variant="title" style={styles.workoutTitle}>
                  {workoutTitle(routine, day)}
                </Text>
              </View>

              {exercises.length > 0 ? (
                <>
                  <View style={styles.progress}>
                    <View style={styles.progressLabels}>
                      <Text style={styles.progressLabel}>Progresso do Treino</Text>
                      <Text style={styles.progressValue}>{progress}%</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                  </View>

                  <View style={styles.list}>
                    {exercises.map((item) => (
                      <ExerciseRow
                        key={item.id}
                        item={item}
                        checked={!!workout.checked[item.id]}
                        weight={workout.weights[item.id] ?? ''}
                        onToggle={handleToggle}
                        onWeightChange={handleWeight}
                        onOpenDetail={setDetail}
                      />
                    ))}
                  </View>

                  <RestTimer endsAt={workout.restEndsAt} onDone={handleRestDone} />

                  <Button
                    title="Finalizar Treino"
                    onPress={handleFinish}
                    disabled={checkedCount === 0}
                    icon={<Trophy size={16} color={colors.black} />}
                  />
                  {checkedCount === 0 && <Text style={styles.hint}>Marque os exercícios feitos para finalizar.</Text>}
                </>
              ) : (
                <View style={styles.empty}>
                  <AlertCircle size={24} color={colors.textSecondary} />
                  <Text style={styles.emptyText}>Nenhum exercício cadastrado para o Treino {day}.</Text>
                  <Text style={styles.emptyHint}>Selecione outra letra acima ou consulte seu personal.</Text>
                </View>
              )}
            </Card>
          </>
        )}

        <HistoryCard entries={history} />
      </ScrollView>

      <ExerciseDetailModal item={detail} onClose={() => setDetail(null)} />
      <CelebrationModal
        title={celebrated}
        pending={syncStatus.pending > 0 && !syncStatus.syncing}
        onClose={() => setCelebrated(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.panel },
  content: { gap: 24, paddingHorizontal: 16, paddingTop: 8 },
  welcome: { gap: 4, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(74,74,74,0.2)' },
  greetingText: { fontSize: 28 },
  subtitle: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSecondary },
  stats: { gap: 12 },
  loading: { textAlign: 'center', color: colors.textSecondary, paddingVertical: 24 },
  warning: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.3)',
    backgroundColor: 'rgba(250,204,21,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  warningText: { color: colors.warning, lineHeight: 20 },
  workoutCard: { gap: 20 },
  workoutHeader: { gap: 4, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(74,74,74,0.3)' },
  eyebrow: { fontFamily: fonts.bodyBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: colors.accent },
  workoutTitle: { fontSize: 20 },
  progress: { gap: 8 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 12, color: colors.textSecondary },
  progressValue: { fontFamily: fonts.number, fontSize: 12, color: colors.accent },
  progressTrack: {
    height: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(74,74,74,0.4)',
    backgroundColor: colors.base,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.accent },
  list: { gap: 12 },
  hint: { textAlign: 'center', fontSize: 11, color: colors.textSecondary, marginTop: -8 },
  empty: {
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: 'rgba(51,51,51,0.2)',
    padding: 32,
  },
  emptyText: { textAlign: 'center', color: colors.textSecondary },
  emptyHint: { textAlign: 'center', fontSize: 12, color: 'rgba(163,163,163,0.7)' },
});
