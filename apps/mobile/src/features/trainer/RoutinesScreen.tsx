import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Eye, Pencil, Trash2 } from 'lucide-react-native';
import type { RoutineSummary } from '@personaltrainr/shared';
import { useDeleteRoutine, useRoutines } from '../../hooks/useTrainerData';
import { getErrorMessage } from '../../lib/api';
import { showToast } from '../../stores/toast';
import { Button } from '../../components/Button';
import { ConfirmModal } from '../../components/ConfirmModal';
import { PageHeader } from '../../components/PageHeader';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Text } from '../../components/Text';
import { colors, radius, touchTarget } from '../../theme';

export function RoutinesScreen() {
  const routines = useRoutines();
  const remove = useDeleteRoutine();
  const [deleteTarget, setDeleteTarget] = useState<RoutineSummary | null>(null);

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      showToast('Rotina removida com sucesso.');
      setDeleteTarget(null);
    } catch (err) {
      showToast(getErrorMessage(err, 'Erro ao remover rotina'));
    }
  }

  return (
    <ScrollScreen onRefresh={() => void routines.refetch()} refreshing={routines.isRefetching}>
      <PageHeader title="Rotinas" action={<Button title="Nova rotina" onPress={() => router.push('/rotinas/nova')} />} />

      {routines.isPending ? (
        <Text style={styles.muted}>Carregando rotinas...</Text>
      ) : (routines.data ?? []).length === 0 ? (
        <Text style={styles.emptyBox}>Nenhuma rotina criada ainda.</Text>
      ) : (
        routines.data!.map((routine) => (
          <Pressable
            key={routine.id}
            onPress={() => router.push({ pathname: '/rotinas/[id]', params: { id: routine.id } })}
            style={styles.item}
          >
            <View style={styles.flex}>
              <Text style={styles.name}>{routine.name}</Text>
              <Text style={styles.muted}>{routine.type}</Text>
            </View>
            <IconButton label="Visualizar" onPress={() => router.push({ pathname: '/rotinas/[id]', params: { id: routine.id } })}>
              <Eye size={18} color={colors.accent} />
            </IconButton>
            <IconButton label="Editar" onPress={() => router.push({ pathname: '/rotinas/editar/[id]', params: { id: routine.id } })}>
              <Pencil size={18} color={colors.accent} />
            </IconButton>
            <IconButton label="Excluir" onPress={() => setDeleteTarget(routine)}>
              <Trash2 size={18} color={colors.accent} />
            </IconButton>
          </Pressable>
        ))
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Excluir Rotina"
        itemName={deleteTarget?.name ?? ''}
        confirmLabel="Confirmar exclusão"
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </ScrollScreen>
  );
}

export function IconButton({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.icon, pressed && styles.iconPressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  muted: { fontSize: 13, color: colors.textSecondary },
  emptyBox: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 20,
    color: colors.textSecondary,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 12,
  },
  name: { fontSize: 15 },
  icon: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg },
  iconPressed: { backgroundColor: colors.base },
});
