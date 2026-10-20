import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Activity, CheckCircle, Dumbbell, TrendingUp, Users, type LucideIcon } from 'lucide-react-native';
import { useAuth } from '../../stores/auth';
import { useTrainerDashboard } from '../../hooks/useTrainerData';
import { isPlanLocked } from '../../lib/api';
import { initials, timeAgo } from '../../lib/format';
import { Avatar } from '../../components/Avatar';
import { Card } from '../../components/Card';
import { PageHeader } from '../../components/PageHeader';
import { PlanLocked } from '../../components/PlanLocked';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Text } from '../../components/Text';
import { colors, fonts, radius } from '../../theme';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

// Painel do personal do web (/painel): métricas, alunos ativos, atividade
// recente e rotinas mais usadas.
export function TrainerDashboardScreen() {
  const firstName = useAuth((s) => s.user?.name.split(' ')[0] ?? '');
  const { data, isPending, error, refetch, isRefetching } = useTrainerDashboard();

  if (isPlanLocked(error)) {
    return (
      <ScrollScreen onRefresh={() => void refetch()} refreshing={isRefetching}>
        <PlanLocked title="Dashboard de aderência" />
      </ScrollScreen>
    );
  }

  const maxStudents = Math.max(1, ...(data?.mostUsedRoutines ?? []).map((r) => r.studentsUsing));

  return (
    <ScrollScreen onRefresh={() => void refetch()} refreshing={isRefetching}>
      <PageHeader
        eyebrow="Painel do Personal"
        title={firstName ? `${greeting()}, ${firstName}` : greeting()}
        description="Resumo dos seus alunos, atividade recente e rotinas mais usadas."
      />

      {isPending ? (
        Array.from({ length: 4 }).map((_, i) => <View key={i} style={styles.skeleton} />)
      ) : !data ? (
        <Text style={styles.muted}>Não foi possível carregar o painel. Puxe para baixo para tentar de novo.</Text>
      ) : (
        <>
          <View style={styles.metrics}>
            <Metric label="Alunos Ativos" value={String(data.activeStudentsCount)} icon={Users} />
            <Metric label="Treinos Concluídos" value={String(data.workoutsLast7Days)} icon={Activity} context="últimos 7 dias" />
            <Metric
              label="Rotinas em Uso"
              value={String(data.routinesInUseCount)}
              icon={Dumbbell}
              context={`${data.routinesInUseCount} planos distintos`}
            />
            <Metric label="Adesão Média" value={`${data.adhesionRate}%`} icon={TrendingUp} />
          </View>

          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.flex}>
                <Text variant="title" style={styles.cardTitle}>
                  Alunos Ativos
                </Text>
                <Text style={styles.muted}>{data.activeStudentsCount} ativos agora</Text>
              </View>
              <Pressable onPress={() => router.navigate('/alunos')} hitSlop={8}>
                <Text style={styles.link}>VER TODOS</Text>
              </Pressable>
            </View>
            {data.activeStudentsList.map((s) => (
              <View key={s.id} style={styles.person}>
                <Avatar name={initials(s.name)} url={s.avatarUrl} size={40} />
                <View style={styles.flex}>
                  <Text numberOfLines={1} style={styles.personName}>
                    {s.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.small}>
                    {s.routineName ?? 'Sem rotina'}
                  </Text>
                </View>
              </View>
            ))}
            {data.activeStudentsList.length === 0 && <Text style={styles.muted}>Nenhum aluno conectado.</Text>}
          </Card>

          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.flex}>
                <Text variant="title" style={styles.cardTitle}>
                  Atividade Recente
                </Text>
                <Text style={styles.muted}>Últimas ações dos alunos</Text>
              </View>
            </View>
            {data.recentActivity.map((ev) => (
              <View key={ev.id} style={styles.activity}>
                <View>
                  <Avatar name={initials(ev.studentUsername)} url={ev.studentAvatar} size={40} />
                  <View style={styles.checkBadge}>
                    <CheckCircle size={10} color={colors.accent} />
                  </View>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.activityText}>
                    <Text style={styles.personName}>@{ev.studentUsername}</Text>{' '}
                    <Text style={styles.small}>concluiu exercício</Text>
                  </Text>
                  <Text numberOfLines={1} style={styles.activityExercise}>
                    {ev.exerciseName}
                    {ev.workoutLetter ? ` - Treino ${ev.workoutLetter}` : ''}
                  </Text>
                  {ev.routineName && (
                    <Text numberOfLines={1} style={styles.tiny}>
                      {ev.routineName}
                    </Text>
                  )}
                </View>
                <Text style={styles.small}>{timeAgo(ev.completedAt)}</Text>
              </View>
            ))}
            {data.recentActivity.length === 0 && <Text style={styles.muted}>Nenhuma atividade recente.</Text>}
          </Card>

          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.flex}>
                <Text variant="title" style={styles.cardTitle}>
                  Rotinas Mais Usadas
                </Text>
                <Text style={styles.muted}>Planos atualmente vinculados aos seus alunos</Text>
              </View>
              <Pressable onPress={() => router.navigate('/rotinas/nova')} hitSlop={8}>
                <Text style={styles.link}>MONTAR NOVA</Text>
              </Pressable>
            </View>
            {data.mostUsedRoutines.map((r) => (
              <View key={r.id} style={styles.routine}>
                <View style={styles.routineTop}>
                  <Text style={styles.routineName}>{r.name}</Text>
                  <View style={styles.routineCount}>
                    <Text style={styles.routineNumber}>{r.studentsUsing}</Text>
                    <Text style={styles.small}>alunos</Text>
                  </View>
                </View>
                <Text style={styles.routineType}>{r.type ?? 'Geral'}</Text>
                <View style={styles.bar}>
                  <View style={[styles.barFill, { width: `${Math.round((r.studentsUsing / maxStudents) * 100)}%` }]} />
                </View>
              </View>
            ))}
            {data.mostUsedRoutines.length === 0 && <Text style={styles.muted}>Nenhuma rotina em uso.</Text>}
          </Card>
        </>
      )}
    </ScrollScreen>
  );
}

function Metric({ label, value, icon: Icon, context }: { label: string; value: string; icon: LucideIcon; context?: string }) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricTop}>
        <Text style={styles.metricLabel}>{label}</Text>
        <View style={styles.metricIcon}>
          <Icon size={15} color={colors.accent} />
        </View>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      {context ? <Text style={styles.muted}>{context}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  skeleton: { height: 120, borderRadius: radius.xl, backgroundColor: colors.card },
  muted: { fontSize: 13, color: colors.textSecondary },
  small: { fontSize: 12, color: colors.textSecondary },
  tiny: { fontSize: 10, color: colors.textSecondary },
  link: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.accent },
  metrics: { gap: 12 },
  metric: { gap: 8, borderRadius: radius.xl, backgroundColor: colors.card, padding: 20 },
  metricTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricLabel: { fontFamily: fonts.bodyBold, fontSize: 12, textTransform: 'uppercase', color: colors.textSecondary },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(175,145,80,0.2)',
    backgroundColor: 'rgba(175,145,80,0.1)',
  },
  metricValue: { fontFamily: fonts.number, fontSize: 40, color: colors.white },
  card: { gap: 16, padding: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardTitle: { fontSize: 20, color: colors.white },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  personName: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.white },
  activity: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.card,
    backgroundColor: '#1a1a1a',
  },
  activityText: { fontSize: 14 },
  activityExercise: { marginTop: 2, fontSize: 12, color: colors.accent },
  routine: { gap: 4 },
  routineTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  routineName: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 14, color: colors.white },
  routineCount: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  routineNumber: { fontFamily: fonts.number, fontSize: 18, color: colors.accent },
  routineType: { fontFamily: fonts.bodyBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: colors.textSecondary },
  bar: { height: 4, borderRadius: 2, backgroundColor: colors.base, marginTop: 4 },
  barFill: { height: 4, borderRadius: 2, backgroundColor: colors.accent },
});
