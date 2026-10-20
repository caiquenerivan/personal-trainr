import { memo, useDeferredValue, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Dumbbell, X } from 'lucide-react-native';
import type { CatalogExercise } from '@personaltrainr/shared';
import { normalize } from '../../lib/format';
import { thumbnailUrl } from '../../lib/exerciseMedia';
import { Chips } from '../../components/Chips';
import { SearchInput } from '../../components/SearchInput';
import { Text } from '../../components/Text';
import { colors, fonts, radius, touchTarget } from '../../theme';

export const MUSCLE_GROUPS = [
  'Pernas', 'Peito', 'Costas', 'Ombros', 'Posterior',
  'Bíceps', 'Tríceps', 'Abdômen', 'Glúteos', 'Antebraço',
] as const;

type IndexedExercise = { exercise: CatalogExercise; name: string; haystack: string };

// Normaliza os ~800 nomes uma vez por catálogo, não a cada letra digitada.
export function useExerciseIndex(options: CatalogExercise[]): IndexedExercise[] {
  return useMemo(
    () =>
      options.map((exercise) => {
        const name = normalize(exercise.name);
        return { exercise, name, haystack: `${name} ${normalize(exercise.muscle ?? '')}` };
      }),
    [options],
  );
}

// Mesma busca do ExercisePicker do web: cada palavra precisa aparecer no
// nome ou no grupo muscular; nome que começa com a busca vem primeiro.
export function searchExercises(index: IndexedExercise[], query: string, muscle: string | null): CatalogExercise[] {
  const q = normalize(query).trim();
  const words = q.split(/\s+/).filter(Boolean);
  const pool = muscle ? index.filter((i) => i.exercise.muscle === muscle) : index;
  if (!words.length) return pool.map((i) => i.exercise);
  const rank = (name: string) => (name.startsWith(q) ? 0 : words.every((w) => name.includes(w)) ? 1 : 2);
  return pool
    .filter(({ haystack }) => words.every((w) => haystack.includes(w)))
    .sort((a, b) => rank(a.name) - rank(b.name))
    .map(({ exercise }) => exercise);
}

// Busca e filtro com prioridade baixa: o toque no chip/teclado responde na
// hora e a lista se atualiza logo em seguida.
export function useExerciseSearch(options: CatalogExercise[]) {
  const index = useExerciseIndex(options);
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const deferredMuscle = useDeferredValue(muscle);
  const results = useMemo(
    () => searchExercises(index, deferredQuery, deferredMuscle),
    [index, deferredQuery, deferredMuscle],
  );
  return { query, setQuery, muscle, setMuscle, results };
}

export const ExerciseThumb = memo(function ExerciseThumb({ exercise, size = 44 }: { exercise: CatalogExercise; size?: number }) {
  const [failed, setFailed] = useState(false);
  const box = { width: size, height: size, borderRadius: radius.lg };
  const uri = thumbnailUrl(exercise.gifUrl);
  if (!uri || failed) {
    return (
      <View style={[styles.thumbFallback, box]}>
        <Dumbbell size={size / 2.4} color={colors.textSecondary} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={[styles.thumb, box]}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={0}
      recyclingKey={exercise.id}
      onError={() => setFailed(true)}
    />
  );
});

const PickerRow = memo(function PickerRow({
  item,
  onPick,
}: {
  item: CatalogExercise;
  onPick: (exercise: CatalogExercise) => void;
}) {
  return (
    <Pressable onPress={() => onPick(item)} style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
      <ExerciseThumb exercise={item} />
      <View style={styles.flex}>
        <Text numberOfLines={2}>{item.name}</Text>
        <Text style={styles.muscle}>{item.muscle ?? '—'}</Text>
      </View>
    </Pressable>
  );
});

export function ExercisePickerModal({
  open,
  options,
  onClose,
  onPick,
}: {
  open: boolean;
  options: CatalogExercise[];
  onClose: () => void;
  onPick: (exercise: CatalogExercise) => void;
}) {
  const insets = useSafeAreaInsets();
  const { query, setQuery, muscle, setMuscle, results } = useExerciseSearch(options);
  const handlePick = (exercise: CatalogExercise) => {
    onPick(exercise);
    setQuery('');
  };

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <Text variant="title" style={styles.title}>
            Escolher exercício
          </Text>
          <Pressable onPress={onClose} style={styles.close} accessibilityLabel="Fechar">
            <X size={22} color={colors.textSecondary} />
          </Pressable>
        </View>
        <View style={styles.filters}>
          <SearchInput value={query} onChangeText={setQuery} placeholder="Buscar exercício…" />
          <Chips
            scroll
            options={['Todos', ...MUSCLE_GROUPS]}
            value={muscle ?? 'Todos'}
            onChange={(m) => setMuscle(m === 'Todos' ? null : m)}
          />
        </View>
        <FlatList
          data={results}
          keyExtractor={(e) => e.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 8 }}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={<Text style={styles.empty}>Nenhum exercício encontrado.</Text>}
          renderItem={({ item }) => <PickerRow item={item} onPick={handlePick} />}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  screen: { flex: 1, backgroundColor: colors.panel },
  header: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 8 },
  title: { flex: 1, fontSize: 20 },
  close: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  filters: { gap: 12, padding: 16 },
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
  muscle: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  thumb: { backgroundColor: colors.base },
  thumbFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.base },
});
