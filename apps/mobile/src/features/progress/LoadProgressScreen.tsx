import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowDownRight, ArrowUpRight, Dumbbell, Minus, Search } from 'lucide-react-native';
import type { ExerciseLoadSummary } from '@personaltrainr/shared';
import { useExerciseLoadHistory, useLoadSummary } from '../../hooks/useWorkoutData';
import { useStudentExerciseLoadHistory, useStudentLoadSummary } from '../../hooks/useTrainerData';
import { PageHeader } from '../../components/PageHeader';
import { AppModal } from '../../components/AppModal';
import { Text } from '../../components/Text';
import { colors, fonts, radius } from '../../theme';
import { LoadChart } from './LoadChart';
import { formatDate, formatKg, formatNum, normalize } from './format';

// Evolução de carga: do próprio usuário (sem alunoId) ou de um aluno visto
// pelo personal, como o LoadProgressPage do web.
export function LoadProgressScreen({
  alunoId,
  studentName,
  onBack,
}: { alunoId?: string; studentName?: string; onBack?: () => void } = {}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ExerciseLoadSummary | null>(null);
  const exerciseId = selected?.exerciseId ?? null;
  const ownSummary = useLoadSummary(!alunoId);
  const studentSummary = useStudentLoadSummary(alunoId);
  const ownHistory = useExerciseLoadHistory(exerciseId, !alunoId);
  const studentHistory = useStudentExerciseLoadHistory(alunoId, exerciseId);
  const summary = alunoId ? studentSummary : ownSummary;
  const history = alunoId ? studentHistory : ownHistory;

  const filtered = useMemo(() => {
    const exercises = summary.data ?? [];
    const words = normalize(query).split(/\s+/).filter(Boolean);
    if (!words.length) return exercises;
    return exercises.filter((e) => {
      const hay = normalize(`${e.name} ${e.muscle ?? ''}`);
      return words.every((w) => hay.includes(w));
    });
  }, [summary.data, query]);

  const chartPoints = (history.data?.points ?? []).filter(
    (p): p is { date: string; weight: number } => p.weight != null,
  );

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={summary.isRefetching} onRefresh={() => {
          summary.refetch();
        }} tintColor={colors.accent} colors={[colors.accent]} />
      }
    >
      <PageHeader
        eyebrow={alunoId ? (studentName ?? 'Aluno') : 'Seu desempenho'}
        title="Evolução de carga"
        description="Compare a carga do começo com a atual em cada exercício. Toque em um exercício para ver o gráfico e o histórico completo."
        onBack={onBack}
      />

      {summary.isPending ? (
        Array.from({ length: 3 }).map((_, i) => <View key={i} style={styles.skeleton} />)
      ) : summary.isError && !summary.data ? (
        <Text style={styles.box}>Não foi possível carregar a evolução de carga.</Text>
      ) : (summary.data ?? []).length === 0 ? (
        <View style={[styles.box, styles.emptyBox]}>
          <Dumbbell size={28} color={colors.accent} />
          <Text style={styles.emptyTitle}>Ainda não há treinos registrados.</Text>
          <Text style={styles.emptyText}>
            A evolução aparece aqui conforme os exercícios são concluídos com a carga informada.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.search}>
            <Search size={16} color={colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar exercício…"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor={colors.accent}
              style={styles.searchInput}
            />
          </View>

          {filtered.map((e) => (
            <Pressable
              key={e.exerciseId}
              onPress={() => setSelected(e)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              <Text style={styles.itemName}>{e.name}</Text>
              <Text style={styles.itemMeta}>
                {e.muscle ?? '—'} · {e.sessions} {e.sessions === 1 ? 'vez' : 'vezes'}
              </Text>

              {e.first && e.last ? (
                <>
                  <View style={styles.compare}>
                    <View>
                      <Text style={styles.compareLabel}>Antes</Text>
                      <Kg value={e.first.weight} color={colors.textPrimary} />
                      <Text style={styles.compareDate}>{formatDate(e.first.date)}</Text>
                    </View>
                    <View style={styles.right}>
                      <Text style={styles.compareLabel}>Agora</Text>
                      <Kg value={e.last.weight} color={colors.accentLight} />
                      <Text style={styles.compareDate}>{formatDate(e.last.date)}</Text>
                    </View>
                  </View>
                  <View style={styles.footer}>
                    <Delta first={e.first.weight} last={e.last.weight} />
                    {e.maxWeight != null && <Text style={styles.max}>Máx. {formatKg(e.maxWeight)}</Text>}
                  </View>
                </>
              ) : (
                <Text style={styles.noLoad}>Feito sem carga registrada.</Text>
              )}
            </Pressable>
          ))}

          {filtered.length === 0 && <Text style={styles.emptyText}>Nenhum exercício encontrado.</Text>}
        </>
      )}

      <AppModal open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ''}>
        {history.isPending ? (
          <View style={styles.chartSkeleton} />
        ) : chartPoints.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma carga registrada para este exercício.</Text>
        ) : (
          <>
            <View style={styles.chart}>
              <LoadChart points={chartPoints} />
            </View>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHead]}>
                <Text style={styles.th}>Data</Text>
                <Text style={styles.th}>Carga</Text>
              </View>
              {[...chartPoints].reverse().map((p, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text>{formatDate(p.date)}</Text>
                  <Text>{formatKg(p.weight)}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </AppModal>
    </ScrollView>
  );
}

// número na fonte de métricas e a unidade em texto normal (a fonte de números não tem minúsculas)
function Kg({ value, color }: { value: number; color: string }) {
  return (
    <View style={styles.kg}>
      <Text style={[styles.kgNumber, { color }]}>{formatNum(value)}</Text>
      <Text style={styles.kgUnit}>kg</Text>
    </View>
  );
}

function Delta({ first, last }: { first: number; last: number }) {
  const diff = last - first;
  const pct = first > 0 ? Math.round((diff / first) * 100) : null;
  const Icon = diff === 0 ? Minus : diff > 0 ? ArrowUpRight : ArrowDownRight;
  const color = diff === 0 ? colors.textSecondary : diff > 0 ? colors.accentLight : colors.danger;
  return (
    <View style={styles.delta}>
      <Icon size={16} color={color} />
      <Text style={[styles.deltaText, { color }]}>
        {diff > 0 ? '+' : ''}
        {formatKg(diff)}
        {pct !== null && diff !== 0 ? ` (${diff > 0 ? '+' : ''}${pct}%)` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.panel },
  content: { gap: 16, paddingHorizontal: 16, paddingTop: 8 },
  skeleton: { height: 140, borderRadius: radius.xl, backgroundColor: colors.card },
  box: { borderRadius: radius.xl, backgroundColor: colors.card, padding: 24, color: colors.textSecondary },
  emptyBox: { alignItems: 'center', gap: 8 },
  emptyTitle: { textAlign: 'center' },
  emptyText: { textAlign: 'center', fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.base,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, height: 48, color: colors.textPrimary, fontFamily: fonts.body, fontSize: 15 },
  item: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.card,
    padding: 20,
  },
  itemPressed: { borderColor: colors.accent },
  itemName: { fontFamily: fonts.bodyBold, fontSize: 14 },
  itemMeta: { marginTop: 2, fontSize: 12, color: colors.textSecondary },
  compare: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, marginTop: 16 },
  right: { alignItems: 'flex-end' },
  compareLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: colors.textSecondary },
  compareDate: { fontSize: 11, color: colors.textSecondary },
  kg: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  kgNumber: { fontFamily: fonts.number, fontSize: 18 },
  kgUnit: { fontSize: 12, color: colors.textSecondary },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deltaText: { fontFamily: fonts.bodyBold, fontSize: 13 },
  max: { fontSize: 12, color: colors.textSecondary },
  noLoad: { marginTop: 16, fontSize: 12, color: colors.textSecondary },
  chartSkeleton: { height: 220, borderRadius: radius.lg, backgroundColor: colors.base },
  chart: { borderRadius: radius.lg, backgroundColor: colors.base, padding: 12 },
  table: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, overflow: 'hidden' },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  tableHead: { backgroundColor: colors.card, borderTopWidth: 0 },
  th: { fontFamily: fonts.bodyBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: colors.textSecondary },
});
