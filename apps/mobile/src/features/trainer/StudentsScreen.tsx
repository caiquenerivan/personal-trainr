import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Eye, Mail } from 'lucide-react-native';
import type { TrainerStudent } from '@personaltrainr/shared';
import { useStudents, useSubscription } from '../../hooks/useTrainerData';
import { ageFrom, daysUntil, normalize } from '../../lib/format';
import { AppModal } from '../../components/AppModal';
import { Avatar } from '../../components/Avatar';
import { Chips } from '../../components/Chips';
import { PageHeader } from '../../components/PageHeader';
import { ScrollScreen } from '../../components/ScrollScreen';
import { SearchInput } from '../../components/SearchInput';
import { Text } from '../../components/Text';
import { colors, fonts, radius } from '../../theme';
import { AssignRoutineModal } from './AssignRoutineModal';

const FILTERS = ['TODOS', 'ATIVOS', 'INATIVOS'] as const;
type Filter = (typeof FILTERS)[number];

const PLAN_LABELS: Record<string, string> = { FREE: 'Grátis', PRO: 'Pro', UNLIMITED: 'Ilimitado' };

export function StudentsScreen() {
  const students = useStudents();
  const subscription = useSubscription();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('TODOS');
  const [detail, setDetail] = useState<TrainerStudent | null>(null);
  const [linkTarget, setLinkTarget] = useState<string | null>(null);

  const all = students.data ?? [];
  const active = all.filter((s) => s.hasActiveRoutine).length;
  const q = normalize(search);
  const filtered = all.filter((s) => {
    if (q && !normalize(`${s.name} ${s.email}`).includes(q)) return false;
    if (filter === 'ATIVOS') return s.hasActiveRoutine;
    if (filter === 'INATIVOS') return !s.hasActiveRoutine;
    return true;
  });
  const limit = subscription.data?.studentLimit;

  return (
    <ScrollScreen
      onRefresh={() => {
        students.refetch();
        subscription.refetch();
      }}
      refreshing={students.isRefetching}
    >
      <PageHeader
        title="Alunos"
        description={`${all.length} ${all.length === 1 ? 'aluno' : 'alunos'} • ${active} com rotina ativa`}
        action={
          limit != null && subscription.data ? (
            <View style={[styles.planBadge, all.length >= limit && styles.planBadgeFull]}>
              <Text style={[styles.planText, all.length >= limit && styles.planTextFull]}>
                {all.length}/{limit} do plano {PLAN_LABELS[subscription.data.plan] ?? subscription.data.plan}
              </Text>
            </View>
          ) : undefined
        }
      />

      <SearchInput value={search} onChangeText={setSearch} placeholder="Buscar alunos..." />
      <Chips options={FILTERS} value={filter} onChange={setFilter} />

      {students.isPending ? (
        <Text style={styles.muted}>Carregando alunos...</Text>
      ) : all.length === 0 ? (
        <Text style={styles.empty}>Nenhum aluno conectado a você ainda.</Text>
      ) : (
        filtered.map((student) => (
          <Pressable key={student.id} onPress={() => setDetail(student)} style={styles.card}>
            <View style={styles.cardTop}>
              <Avatar name={student.name} url={student.avatarUrl} size={48} />
              <View style={styles.flex}>
                <Text variant="title" style={styles.name} numberOfLines={2}>
                  {student.name}
                </Text>
                {student.bio && (
                  <Text style={styles.muted} numberOfLines={1}>
                    {student.bio}
                  </Text>
                )}
              </View>
              {student.hasActiveRoutine ? (
                <View style={[styles.status, styles.statusActive]}>
                  <View style={styles.dot} />
                  <Text style={[styles.statusText, { color: colors.success }]}>ATIVO</Text>
                </View>
              ) : (
                <View style={styles.status}>
                  <Text style={styles.statusText}>INATIVO</Text>
                </View>
              )}
            </View>

            <View style={styles.email}>
              <Mail size={14} color={colors.textSecondary} />
              <Text style={styles.muted} numberOfLines={1}>
                {student.email}
              </Text>
            </View>

            {(student.weight || student.height || student.birthDate) && (
              <View style={styles.metrics}>
                <MetricCell label="PESO" value={student.weight ? `${student.weight} kg` : '—'} />
                <MetricCell label="ALTURA" value={student.height ? `${student.height} cm` : '—'} />
                <MetricCell label="IDADE" value={student.birthDate ? `${ageFrom(student.birthDate)} a` : '—'} />
              </View>
            )}

            <Text style={styles.routineLine}>
              ROTINA <Text style={styles.muted}>• {student.routineName ?? 'Nenhuma vinculada'}</Text>
            </Text>
            {student.hasActiveRoutine && student.expiresAt && <Expiry iso={student.expiresAt} />}

            <View style={styles.actions}>
              <Pressable onPress={() => setDetail(student)} style={styles.secondaryAction}>
                <Eye size={14} color={colors.textSecondary} />
                <Text style={styles.secondaryText}>Ver detalhes</Text>
              </Pressable>
              <Pressable onPress={() => setLinkTarget(student.id)} style={styles.primaryAction}>
                <Text style={styles.primaryText}>Vincular rotina</Text>
              </Pressable>
            </View>
          </Pressable>
        ))
      )}

      <AppModal open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? 'Detalhes do Aluno'}>
        {detail && (
          <>
            <View style={styles.cardTop}>
              <Avatar name={detail.name} url={detail.avatarUrl} size={64} />
              <View style={styles.flex}>
                <Text variant="title" style={styles.name}>
                  {detail.name}
                </Text>
                {detail.bio && <Text style={styles.muted}>{detail.bio}</Text>}
              </View>
            </View>
            <View style={styles.detailGrid}>
              <DetailCell label="Email" value={detail.email} />
              <DetailCell label="Status" value={detail.hasActiveRoutine ? 'Ativo' : 'Inativo'} color={detail.hasActiveRoutine ? colors.success : undefined} />
              <DetailCell label="Peso" value={detail.weight ? `${detail.weight} kg` : '—'} accent />
              <DetailCell label="Altura" value={detail.height ? `${detail.height} cm` : '—'} accent />
              <DetailCell label="Idade" value={detail.birthDate ? `${ageFrom(detail.birthDate)} anos` : '—'} accent />
              <DetailCell
                label="Data de Nasc."
                value={detail.birthDate ? new Date(detail.birthDate).toLocaleDateString('pt-BR') : '—'}
              />
            </View>
          </>
        )}
      </AppModal>

      <AssignRoutineModal
        key={linkTarget ?? 'none'}
        open={!!linkTarget}
        alunoId={linkTarget ?? undefined}
        onClose={() => setLinkTarget(null)}
      />
    </ScrollScreen>
  );
}

function Expiry({ iso }: { iso: string }) {
  const days = daysUntil(iso);
  if (days < 0) return <Text style={[styles.small, { color: colors.danger }]}>Rotina expirada</Text>;
  if (days === 0) return <Text style={[styles.small, { color: colors.orange }]}>Vence hoje</Text>;
  return (
    <Text style={styles.small}>
      Vence em <Text style={styles.expiryNumber}>{days}</Text> {days === 1 ? 'dia' : 'dias'}
    </Text>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCell}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function DetailCell({ label, value, accent, color }: { label: string; value: string; accent?: boolean; color?: string }) {
  return (
    <View style={styles.detailCell}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[accent && styles.metricValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  muted: { fontSize: 13, color: colors.textSecondary },
  small: { fontSize: 12, color: colors.textSecondary },
  empty: { textAlign: 'center', color: colors.textSecondary, paddingVertical: 32 },
  planBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(74,74,74,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  planBadgeFull: { borderColor: 'rgba(239,68,68,0.5)', backgroundColor: 'rgba(239,68,68,0.1)' },
  planText: { fontFamily: fonts.bodyBold, fontSize: 11, textTransform: 'uppercase', color: colors.textSecondary },
  planTextFull: { color: colors.danger },
  card: { gap: 12, borderRadius: radius.xl, backgroundColor: colors.card, padding: 20 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 17 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.full, backgroundColor: colors.base, paddingHorizontal: 12, paddingVertical: 4 },
  statusActive: { backgroundColor: 'rgba(20,83,45,0.3)' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  statusText: { fontSize: 12, color: colors.textSecondary },
  email: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metrics: { flexDirection: 'row', borderRadius: radius.lg, backgroundColor: colors.base, padding: 12 },
  metricCell: { flex: 1, alignItems: 'center', gap: 2 },
  metricLabel: { fontSize: 11, textTransform: 'uppercase', color: colors.textSecondary },
  metricValue: { fontFamily: fonts.number, color: colors.accent },
  routineLine: { fontSize: 12, color: colors.accent },
  expiryNumber: { fontFamily: fonts.number, color: colors.accent },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  secondaryText: { fontSize: 12, textTransform: 'uppercase', color: colors.textSecondary },
  primaryAction: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, backgroundColor: colors.accent, paddingHorizontal: 14 },
  primaryText: { fontFamily: fonts.bodyBold, fontSize: 12, textTransform: 'uppercase', color: colors.black },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16, borderRadius: radius.lg, backgroundColor: 'rgba(51,51,51,0.5)', padding: 16 },
  detailCell: { width: '50%', gap: 2, paddingRight: 8 },
});
