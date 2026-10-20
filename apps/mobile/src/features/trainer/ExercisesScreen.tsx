import { memo, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { PlayCircle, Plus } from 'lucide-react-native';
import type { CatalogExercise } from '@personaltrainr/shared';
import { useDeleteExercise, useExerciseCatalog, useSaveExercise } from '../../hooks/useTrainerData';
import { getErrorMessage } from '../../lib/api';
import { useAuth } from '../../stores/auth';
import { showToast } from '../../stores/toast';
import { AppModal } from '../../components/AppModal';
import { Button } from '../../components/Button';
import { Chips } from '../../components/Chips';
import { ConfirmModal } from '../../components/ConfirmModal';
import { PageHeader } from '../../components/PageHeader';
import { SearchInput } from '../../components/SearchInput';
import { Text } from '../../components/Text';
import { TextField } from '../../components/TextField';
import { colors, fonts, radius } from '../../theme';
import { ExerciseThumb, MUSCLE_GROUPS, useExerciseSearch } from './ExercisePickerModal';

const EMPTY: CatalogExercise[] = [];

const ExerciseRow = memo(function ExerciseRow({
  item,
  isOwn,
  onOpen,
}: {
  item: CatalogExercise;
  isOwn: boolean;
  onOpen: (exercise: CatalogExercise) => void;
}) {
  return (
    <Pressable onPress={() => onOpen(item)} style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
      <ExerciseThumb exercise={item} size={52} />
      <View style={styles.flex}>
        <Text numberOfLines={2} style={styles.itemName}>
          {item.name}
        </Text>
        <Text style={styles.muted}>
          {item.muscle ?? '—'}
          {isOwn ? ' · Seu exercício' : ''}
        </Text>
      </View>
    </Pressable>
  );
});

type Form = { name: string; muscle: string; videoUrl: string; gifUrl: string; observations: string };
const EMPTY_FORM: Form = { name: '', muscle: '', videoUrl: '', gifUrl: '', observations: '' };

export function ExercisesScreen() {
  const insets = useSafeAreaInsets();
  const userId = useAuth((s) => s.user?.id);
  const catalog = useExerciseCatalog();
  const save = useSaveExercise();
  const remove = useDeleteExercise();

  const [detail, setDetail] = useState<CatalogExercise | null>(null);
  const [editing, setEditing] = useState<CatalogExercise | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatalogExercise | null>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);

  const { query, setQuery, muscle, setMuscle, results } = useExerciseSearch(catalog.data ?? EMPTY);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditing('new');
  }

  function openEdit(exercise: CatalogExercise) {
    setForm({
      name: exercise.name,
      muscle: exercise.muscle ?? '',
      videoUrl: exercise.videoUrl ?? '',
      gifUrl: exercise.gifUrl ?? '',
      observations: exercise.observations ?? '',
    });
    setDetail(null);
    setEditing(exercise);
  }

  async function submit() {
    if (form.name.trim().length < 2 || !form.muscle) return;
    try {
      await save.mutateAsync({
        id: editing && editing !== 'new' ? editing.id : undefined,
        payload: {
          name: form.name.trim(),
          muscle: form.muscle,
          videoUrl: form.videoUrl.trim() || null,
          gifUrl: form.gifUrl.trim() || null,
          observations: form.observations.trim() || null,
        },
      });
      showToast(editing === 'new' ? 'Exercício cadastrado.' : 'Exercício atualizado.');
      setEditing(null);
    } catch (err) {
      showToast(getErrorMessage(err, 'Erro ao salvar exercício'));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      showToast('Exercício excluído.');
      setDeleteTarget(null);
    } catch (err) {
      showToast(getErrorMessage(err, 'Erro ao excluir exercício'));
    }
  }

  const header = (
    <View style={styles.header}>
      <PageHeader
        title="Exercícios"
        description={catalog.data ? `${catalog.data.length} exercícios na biblioteca` : undefined}
        action={<Button title="Cadastrar exercício" onPress={openCreate} icon={<Plus size={16} color={colors.black} />} />}
      />
      <SearchInput value={query} onChangeText={setQuery} placeholder="Buscar por nome ou grupo muscular..." />
      <Chips scroll options={['Todos', ...MUSCLE_GROUPS]} value={muscle ?? 'Todos'} onChange={(m) => setMuscle(m === 'Todos' ? null : m)} />
    </View>
  );

  return (
    <View style={styles.flex}>
      <FlatList
        data={results}
        keyExtractor={(e) => e.id}
        ListHeaderComponent={header}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        refreshing={catalog.isRefetching}
        onRefresh={() => void catalog.refetch()}
        ListEmptyComponent={
          <Text style={styles.empty}>{catalog.isPending ? 'Carregando exercícios...' : 'Nenhum exercício encontrado.'}</Text>
        }
        renderItem={({ item }) => (
          <ExerciseRow item={item} isOwn={!!item.trainerId && item.trainerId === userId} onOpen={setDetail} />
        )}
      />

      <AppModal open={!!detail} onClose={() => setDetail(null)} title="Detalhes do Exercício">
        {detail && (
          <>
            <Text variant="title" style={styles.detailName}>
              {detail.name}
            </Text>
            <Text style={styles.muted}>{detail.muscle}</Text>
            {detail.gifUrl ? (
              <View style={styles.media}>
                <Image source={{ uri: detail.gifUrl }} style={StyleSheet.absoluteFill} contentFit="contain" autoplay />
              </View>
            ) : !detail.videoUrl ? (
              <Text style={styles.noMedia}>Ainda não há vídeo ou gif de demonstração para este exercício.</Text>
            ) : null}
            {detail.videoUrl && (
              <Button
                title="Abrir vídeo"
                variant="outline"
                icon={<PlayCircle size={16} color={colors.accent} />}
                onPress={() => Linking.openURL(detail.videoUrl!)}
              />
            )}
            {detail.observations && (
              <View style={styles.obs}>
                <Text variant="label">Observações</Text>
                <Text style={styles.obsText}>{detail.observations}</Text>
              </View>
            )}
            {detail.trainerId && detail.trainerId === userId && (
              <View style={styles.ownerActions}>
                <Button title="Editar" variant="outline" onPress={() => openEdit(detail)} />
                <Button
                  title="Excluir"
                  variant="danger"
                  onPress={() => {
                    setDeleteTarget(detail);
                    setDetail(null);
                  }}
                />
              </View>
            )}
          </>
        )}
      </AppModal>

      <AppModal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Cadastrar Exercício' : 'Editar Exercício'}>
        <TextField label="Nome" value={form.name} onChangeText={(name) => setForm({ ...form, name })} maxLength={120} />
        <View style={styles.field}>
          <Text variant="label">Grupo muscular</Text>
          <Chips options={MUSCLE_GROUPS} value={(form.muscle || null) as (typeof MUSCLE_GROUPS)[number] | null} onChange={(m) => setForm({ ...form, muscle: m })} />
        </View>
        <TextField
          label="URL do vídeo"
          value={form.videoUrl}
          onChangeText={(videoUrl) => setForm({ ...form, videoUrl })}
          placeholder="https://..."
          autoCapitalize="none"
          keyboardType="url"
        />
        <TextField
          label="URL do gif"
          value={form.gifUrl}
          onChangeText={(gifUrl) => setForm({ ...form, gifUrl })}
          placeholder="https://..."
          autoCapitalize="none"
          keyboardType="url"
        />
        <TextField
          label="Observações"
          value={form.observations}
          onChangeText={(observations) => setForm({ ...form, observations })}
          multiline
          style={styles.textarea}
        />
        <Button
          title={editing === 'new' ? 'Cadastrar' : 'Salvar'}
          onPress={submit}
          loading={save.isPending}
          disabled={form.name.trim().length < 2 || !form.muscle}
        />
      </AppModal>

      <ConfirmModal
        open={!!deleteTarget}
        title="Excluir Exercício"
        itemName={deleteTarget?.name ?? ''}
        confirmLabel="Excluir"
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0, backgroundColor: colors.panel },
  header: { gap: 16, marginBottom: 8 },
  list: { gap: 10, paddingHorizontal: 16, paddingTop: 8 },
  empty: { textAlign: 'center', color: colors.textSecondary, paddingVertical: 32 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 10,
  },
  itemPressed: { borderColor: colors.accent },
  itemName: { fontFamily: fonts.bodyBold, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.3 },
  muted: { fontSize: 13, color: colors.textSecondary },
  detailName: { fontSize: 20 },
  media: { aspectRatio: 1, borderRadius: radius.xl, backgroundColor: colors.base, overflow: 'hidden' },
  noMedia: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.base,
    padding: 20,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  obs: { gap: 6 },
  obsText: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.base, padding: 12, lineHeight: 20 },
  ownerActions: { gap: 10 },
  field: { gap: 8 },
  textarea: { height: 96, paddingTop: 12, textAlignVertical: 'top' },
});
