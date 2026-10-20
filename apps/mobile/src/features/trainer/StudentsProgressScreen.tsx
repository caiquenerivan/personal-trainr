import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CalendarDays, Flame, Target, TrendingUp, type LucideIcon } from 'lucide-react-native';
import { useStudentsProgress } from '../../hooks/useTrainerData';
import { isPlanLocked } from '../../lib/api';
import { initials } from '../../lib/format';
import { Avatar } from '../../components/Avatar';
import { PageHeader } from '../../components/PageHeader';
import { PlanLocked } from '../../components/PlanLocked';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Text } from '../../components/Text';
import { colors, fonts, radius } from '../../theme';
import { DonutProgress } from './DonutProgress';

function adhesionInfo(rate: number) {
  if (rate >= 75) return { color: '#AF9150', label: 'Excelente adesão', text: 'Aluno comprometido com a rotina.' };
  if (rate >= 50) return { color: '#D4B872', label: 'Boa adesão', text: 'Bom ritmo, pode melhorar.' };
  if (rate >= 30) return { color: '#F97316', label: 'Atenção necessária', text: 'Precisa de incentivo.' };
  return { color: '#DC2626', label: 'Risco de abandono', text: 'Risco alto de desistência.' };
}

export function StudentsProgressScreen() {
  const { data, isPending, error, refetch, isRefetching } = useStudentsProgress();

  if (isPlanLocked(error)) {
    return (
      <ScrollScreen onRefresh={() => void refetch()} refreshing={isRefetching}>
        <PlanLocked title="Progresso dos alunos" />
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen onRefresh={() => void refetch()} refreshing={isRefetching}>
      <PageHeader
        eyebrow="Progresso dos alunos"
        title="Engajamento e desempenho"
        description="Acompanhe a frequência, adesão e evolução de cada aluno vinculado ao seu plano de treinamento."
      />

      {isPending ? (
        Array.from({ length: 3 }).map((_, i) => <View key={i} style={styles.skeleton} />)
      ) : !data || data.length === 0 ? (
        <View style={styles.empty}>
          <TrendingUp size={48} color={colors.border} />
          <Text style={styles.muted}>Nenhum aluno conectado ainda.</Text>
          <Text style={styles.small}>Convide alunos para começar a acompanhar o progresso deles.</Text>
        </View>
      ) : (
        data.map((student) => {
          const adhesion = adhesionInfo(student.adhesionRate);
          const active = student.connectionStatus === 'ACTIVE';
          return (
            <View key={student.id} style={styles.card}>
              <View style={styles.top}>
                <Avatar name={initials(student.name)} url={student.avatarUrl} size={48} />
                <View style={styles.flex}>
                  <Text numberOfLines={1} style={styles.name}>
                    {student.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.small}>
                    @{student.username ?? '---'}
                  </Text>
                </View>
                <View style={styles.badge}>
                  <View style={[styles.dot, { backgroundColor: active ? colors.accent : '#666' }]} />
                  <Text style={[styles.badgeText, !active && { color: '#666' }]}>{active ? 'Ativo' : 'Inativo'}</Text>
                </View>
              </View>

              <View style={styles.grid}>
                <Cell icon={Target} label="Frequência" value={`${student.weeklyGoal}x`} unit="/ semana" />
                <Cell icon={Flame} label="Streak" value={String(student.weeklyStreak)} unit={student.weeklyStreak === 1 ? 'semana' : 'semanas'} />
                <Cell
                  icon={CalendarDays}
                  label="Últimos 7 dias"
                  value={String(student.workoutsLast7Days)}
                  unit={student.workoutsLast7Days === 1 ? 'treino' : 'treinos'}
                />
                <Cell icon={TrendingUp} label="Adesão" value={`${student.adhesionRate}%`} color={adhesion.color} />
              </View>

              <View style={styles.adhesion}>
                <DonutProgress percentage={student.adhesionRate} color={adhesion.color} />
                <View style={styles.flex}>
                  <Text style={styles.name}>{adhesion.label}</Text>
                  <Text style={styles.small}>{adhesion.text}</Text>
                </View>
              </View>

              <Pressable
                onPress={() =>
                  router.push({ pathname: '/progresso/[alunoId]', params: { alunoId: student.id, name: student.name } })
                }
                style={({ pressed }) => [styles.loadButton, pressed && styles.loadButtonPressed]}
                accessibilityRole="button"
              >
                <Text style={styles.loadText}>Evolução de carga</Text>
              </Pressable>
            </View>
          );
        })
      )}
    </ScrollScreen>
  );
}

function Cell({ icon: Icon, label, value, unit, color }: { icon: LucideIcon; label: string; value: string; unit?: string; color?: string }) {
  return (
    <View style={styles.cell}>
      <View style={styles.cellTop}>
        <Icon size={12} color={colors.textSecondary} />
        <Text style={styles.cellLabel}>{label}</Text>
      </View>
      <Text style={[styles.cellValue, color ? { color } : null]}>
        {value}
        {unit ? <Text style={styles.cellUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  muted: { color: colors.textSecondary },
  small: { fontSize: 12, color: colors.textSecondary },
  skeleton: { height: 260, borderRadius: radius.xl, backgroundColor: colors.card },
  empty: { alignItems: 'center', gap: 8, borderRadius: radius.xl, backgroundColor: colors.card, paddingVertical: 48, paddingHorizontal: 16 },
  card: { gap: 20, borderRadius: radius.xl, backgroundColor: colors.card, padding: 20 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.white },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.base,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: colors.white },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { width: '47%', flexGrow: 1, gap: 6, borderRadius: radius.lg, backgroundColor: colors.base, padding: 12 },
  cellTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cellLabel: { fontFamily: fonts.bodyBold, fontSize: 10, textTransform: 'uppercase', color: colors.textSecondary },
  cellValue: { fontFamily: fonts.number, fontSize: 18, color: colors.white },
  cellUnit: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  adhesion: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  loadButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadButtonPressed: { borderColor: colors.accent },
  loadText: { fontFamily: fonts.bodyBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: colors.textSecondary },
});
