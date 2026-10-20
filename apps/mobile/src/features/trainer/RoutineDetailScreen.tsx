import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Link2, Pencil, Trash2 } from 'lucide-react-native';
import type { Day } from '@personaltrainr/shared';
import { useDeleteRoutine, useRoutine, useStudents } from '../../hooks/useTrainerData';
import { getErrorMessage } from '../../lib/api';
import { useAuth } from '../../stores/auth';
import { showToast } from '../../stores/toast';
import { Alert } from '../../components/Alert';
import { Card } from '../../components/Card';
import { ConfirmModal } from '../../components/ConfirmModal';
import { PageHeader } from '../../components/PageHeader';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Text } from '../../components/Text';
import { colors, fonts, radius } from '../../theme';
import { AssignRoutineModal } from './AssignRoutineModal';
import { ExerciseThumb } from './ExercisePickerModal';

export function RoutineDetailScreen({ id }: { id: string }) {
  const me = useAuth((s) => s.user);
  const routine = useRoutine(id);
  const students = useStudents();
  const remove = useDeleteRoutine();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [assigning, setAssigning] = useState(false);

  async function handleDelete() {
    try {
      await remove.mutateAsync(id);
      showToast('Rotina removida com sucesso.');
      setConfirmDelete(false);
      router.back();
    } catch (err) {
      showToast(getErrorMessage(err, 'Erro ao remover rotina'));
    }
  }

  const data = routine.data;
  const days = (data?.type.split('') ?? []) as Day[];
  // O personal também pode vincular a rotina a si mesmo (Meu Treino).
  const studentOptions = [
    ...(me ? [{ id: me.id, name: `${me.name} (eu)` }] : []),
    ...(students.data ?? []).map((s) => ({ id: s.id, name: s.name })),
  ];

  return (
    <ScrollScreen onRefresh={() => void routine.refetch()} refreshing={routine.isRefetching}>
      <PageHeader title="Detalhes da rotina" onBack={() => router.back()} />

      {routine.isPending ? (
        <Text style={styles.muted}>Carregando rotina...</Text>
      ) : !data ? (
        <Alert>Erro ao carregar rotina</Alert>
      ) : (
        <Card style={styles.card}>
          <View style={styles.headerTexts}>
            <Text variant="title" style={styles.name}>
              {data.name}
            </Text>
            <Text style={styles.small}>Criada em {new Date(data.createdAt).toLocaleDateString('pt-BR')}</Text>
          </View>
          <View style={styles.actions}>
            <Action icon={<Link2 size={16} color={colors.black} />} label="Vincular" primary onPress={() => setAssigning(true)} />
            <Action
              icon={<Pencil size={16} color={colors.accent} />}
              label="Editar"
              onPress={() => router.push({ pathname: '/rotinas/editar/[id]', params: { id } })}
            />
            <Action icon={<Trash2 size={16} color={colors.danger} />} label="Excluir" danger onPress={() => setConfirmDelete(true)} />
          </View>

          {days.map((day) => {
            const items = data.exercises.filter((e) => e.day === day);
            const description = items[0]?.dayDescription;
            return (
              <View key={day} style={styles.day}>
                <Text variant="title" style={styles.dayTitle}>
                  Treino {day}
                </Text>
                {description && <Text style={styles.small}>{description}</Text>}
                {items.length > 0 ? (
                  items.map((ex) => (
                    <View key={ex.id} style={styles.exercise}>
                      <ExerciseThumb exercise={ex.exercise} size={40} />
                      <View style={styles.flex}>
                        <Text numberOfLines={2}>{ex.exercise.name}</Text>
                        <View style={styles.meta}>
                          <Text style={styles.metric}>{ex.series}x</Text>
                          <Text style={styles.metric}>{ex.reps} reps</Text>
                          <Text style={styles.small}>{ex.restTime}s descanso</Text>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.small}>Nenhum exercício cadastrado neste treino.</Text>
                )}
              </View>
            );
          })}
        </Card>
      )}

      <ConfirmModal
        open={confirmDelete}
        title="Excluir Rotina"
        itemName={data?.name ?? ''}
        confirmLabel="Confirmar exclusão"
        loading={remove.isPending}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
      <AssignRoutineModal
        key={assigning ? 'open' : 'closed'}
        open={assigning}
        fixedRoutineId={id}
        studentOptions={studentOptions}
        onClose={() => setAssigning(false)}
      />
    </ScrollScreen>
  );
}

function Action({
  icon,
  label,
  onPress,
  primary,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.action,
        primary && styles.actionPrimary,
        danger && styles.actionDanger,
        pressed && { opacity: 0.85 },
      ]}
    >
      {icon}
      <Text style={[styles.actionText, primary && { color: colors.black }, danger && { color: colors.danger }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  muted: { color: colors.textSecondary },
  small: { fontSize: 12, color: colors.textSecondary },
  card: { gap: 16, padding: 20 },
  headerTexts: { gap: 4 },
  name: { fontSize: 22 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 14,
  },
  actionPrimary: { backgroundColor: colors.accent },
  actionDanger: { borderColor: 'rgba(239,68,68,0.5)' },
  actionText: { fontSize: 13, textTransform: 'uppercase', color: colors.accent },
  day: { gap: 10, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.base, padding: 16 },
  dayTitle: { fontSize: 17, color: colors.accent },
  exercise: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, marginTop: 2 },
  metric: { fontFamily: fonts.number, fontSize: 13, color: colors.accent },
});
