import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronDown, Plus, Trash2 } from 'lucide-react-native';
import type { CatalogExercise, Day, RoutineDetail, RoutineType } from '@personaltrainr/shared';
import { useExerciseCatalog, useRoutine, useSaveRoutine } from '../../hooks/useTrainerData';
import { getErrorMessage } from '../../lib/api';
import { showToast } from '../../stores/toast';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chips } from '../../components/Chips';
import { PageHeader } from '../../components/PageHeader';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Text } from '../../components/Text';
import { TextField } from '../../components/TextField';
import { colors, fonts, radius, touchTarget } from '../../theme';
import { ExercisePickerModal, ExerciseThumb } from './ExercisePickerModal';

const DAYS: Day[] = ['A', 'B', 'C', 'D', 'E'];
const COUNTS = [2, 3, 4, 5] as const;
const TYPE_BY_COUNT: Record<number, RoutineType> = { 2: 'AB', 3: 'ABC', 4: 'ABCD', 5: 'ABCDE' };

type BuilderExercise = { key: string; exercise: CatalogExercise | null; series: string; reps: string; restTime: string };
type BuilderWorkout = { day: Day; description: string; exercises: BuilderExercise[] };

let keySeq = 0;
const newKey = () => `ex-${++keySeq}`;

function emptyWorkouts(count: number): BuilderWorkout[] {
  return DAYS.slice(0, count).map((day) => ({ day, description: '', exercises: [] }));
}

function fromRoutine(routine: RoutineDetail): BuilderWorkout[] {
  return DAYS.slice(0, routine.type.length).map((day) => {
    const items = routine.exercises.filter((e) => e.day === day);
    return {
      day,
      description: items[0]?.dayDescription ?? '',
      exercises: items.map((e) => ({
        key: newKey(),
        exercise: e.exercise,
        series: String(e.series),
        reps: String(e.reps),
        restTime: String(e.restTime),
      })),
    };
  });
}

// Tela de edição carrega a rotina e só então monta o construtor, para o
// estado inicial já vir preenchido.
export function RoutineBuilderScreen({ routineId }: { routineId?: string }) {
  const routine = useRoutine(routineId);
  if (routineId && routine.isPending) {
    return (
      <ScrollScreen>
        <Text style={styles.muted}>Carregando rotina...</Text>
      </ScrollScreen>
    );
  }
  if (routineId && !routine.data) {
    return (
      <ScrollScreen>
        <Alert>Erro ao carregar rotina</Alert>
      </ScrollScreen>
    );
  }
  return <Builder routine={routine.data} />;
}

function Builder({ routine }: { routine?: RoutineDetail }) {
  const catalog = useExerciseCatalog();
  const save = useSaveRoutine();
  const [name, setName] = useState(routine?.name ?? '');
  const [workouts, setWorkouts] = useState<BuilderWorkout[]>(() => (routine ? fromRoutine(routine) : emptyWorkouts(2)));
  const [activeDay, setActiveDay] = useState<Day>('A');
  const [picking, setPicking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeIndex = Math.max(0, workouts.findIndex((w) => w.day === activeDay));
  const active = workouts[activeIndex];

  function setCount(count: number) {
    setWorkouts((prev) =>
      DAYS.slice(0, count).map((day, i) => (prev[i]?.day === day ? prev[i] : { day, description: '', exercises: [] })),
    );
    setActiveDay('A');
  }

  function updateActive(patch: Partial<BuilderWorkout>) {
    setWorkouts((prev) => prev.map((w, i) => (i === activeIndex ? { ...w, ...patch } : w)));
  }

  function updateExercise(key: string, patch: Partial<BuilderExercise>) {
    updateActive({ exercises: active.exercises.map((e) => (e.key === key ? { ...e, ...patch } : e)) });
  }

  function addExercise() {
    const key = newKey();
    updateActive({ exercises: [...active.exercises, { key, exercise: null, series: '3', reps: '10', restTime: '60' }] });
    setPicking(key);
  }

  async function submit() {
    setError(null);
    if (name.trim().length < 2) {
      setError('Dê um nome à rotina (mínimo 2 caracteres).');
      return;
    }
    const exercises = workouts.flatMap((w) =>
      w.exercises
        .filter((e) => e.exercise)
        .map((e) => ({
          exerciseId: e.exercise!.id,
          day: w.day,
          dayDescription: w.description.trim() || undefined,
          series: Math.max(1, parseInt(e.series, 10) || 1),
          reps: Math.max(1, parseInt(e.reps, 10) || 1),
          restTime: Math.max(1, parseInt(e.restTime, 10) || 1),
        })),
    );
    if (exercises.length === 0) {
      setError('Adicione ao menos um exercício.');
      return;
    }
    try {
      const saved = await save.mutateAsync({
        id: routine?.id,
        payload: { name: name.trim(), type: TYPE_BY_COUNT[workouts.length], exercises },
      });
      showToast(routine ? 'Rotina atualizada.' : 'Rotina criada.');
      router.replace({ pathname: '/rotinas/[id]', params: { id: saved.id } });
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao salvar rotina'));
    }
  }

  return (
    <ScrollScreen>
      <PageHeader title={routine ? 'Editar rotina' : 'Montar nova rotina'} onBack={() => router.back()} />

      {error && <Alert>{error}</Alert>}

      <Card style={styles.section}>
        <TextField label="Nome da rotina" value={name} onChangeText={setName} maxLength={80} />
        <View style={styles.field}>
          <Text variant="label">Quantidade de treinos</Text>
          <Chips options={COUNTS} value={workouts.length as (typeof COUNTS)[number]} onChange={setCount} label={(n) => `${n} treinos`} />
        </View>
      </Card>

      <Card style={styles.section}>
        <View style={styles.tabs}>
          {workouts.map((w) => {
            const isActive = w.day === active.day;
            return (
              <Pressable
                key={w.day}
                onPress={() => setActiveDay(w.day)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                style={[styles.tab, isActive && styles.tabActive]}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>Treino {w.day}</Text>
                <Text style={styles.tabCount}>{w.exercises.length}</Text>
              </Pressable>
            );
          })}
        </View>

        <TextField
          label={`Descrição do treino ${active.day}`}
          value={active.description}
          onChangeText={(description) => updateActive({ description })}
          placeholder="Ex: Peito e Bíceps"
          maxLength={60}
        />

        {active.exercises.map((e, index) => (
          <View key={e.key} style={styles.exercise}>
            <View style={styles.exerciseTop}>
              <Text style={styles.order}>{index + 1}</Text>
              <Pressable onPress={() => setPicking(e.key)} style={styles.picker} accessibilityRole="button">
                {e.exercise ? <ExerciseThumb exercise={e.exercise} size={36} /> : null}
                <Text style={[styles.flex, !e.exercise && styles.muted]} numberOfLines={2}>
                  {e.exercise?.name ?? 'Escolher exercício'}
                </Text>
                <ChevronDown size={16} color={colors.accent} />
              </Pressable>
              <Pressable
                onPress={() => updateActive({ exercises: active.exercises.filter((x) => x.key !== e.key) })}
                style={styles.remove}
                accessibilityLabel="Remover exercício"
              >
                <Trash2 size={18} color={colors.accent} />
              </Pressable>
            </View>
            <View style={styles.numbers}>
              <NumberField label="Séries" value={e.series} onChange={(series) => updateExercise(e.key, { series })} />
              <NumberField label="Repetições" value={e.reps} onChange={(reps) => updateExercise(e.key, { reps })} />
              <NumberField label="Descanso (s)" value={e.restTime} onChange={(restTime) => updateExercise(e.key, { restTime })} />
            </View>
          </View>
        ))}

        <Pressable onPress={addExercise} style={styles.add} accessibilityRole="button">
          <Plus size={16} color={colors.accent} />
          <Text style={styles.addText}>Adicionar exercício</Text>
        </Pressable>
      </Card>

      <Button title={routine ? 'Atualizar rotina' : 'Salvar rotina'} onPress={submit} loading={save.isPending} />

      <ExercisePickerModal
        open={!!picking}
        options={catalog.data ?? []}
        onClose={() => setPicking(null)}
        onPick={(exercise) => {
          if (picking) updateExercise(picking, { exercise });
          setPicking(null);
        }}
      />
    </ScrollScreen>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.numberField}>
      <Text variant="label" style={styles.numberLabel}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={3}
        selectionColor={colors.accent}
        style={styles.numberInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  muted: { color: colors.textSecondary },
  section: { gap: 16 },
  field: { gap: 8 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flexDirection: 'row', gap: 4, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive: { borderBottomColor: colors.accent },
  tabText: { fontSize: 13, textTransform: 'uppercase', color: colors.textSecondary },
  tabTextActive: { color: colors.accent },
  tabCount: { fontFamily: fonts.number, fontSize: 10, color: colors.textSecondary },
  exercise: { gap: 12, borderRadius: radius.xl, backgroundColor: colors.base, padding: 12 },
  exerciseTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  order: { fontFamily: fonts.number, width: 18, textAlign: 'center', color: colors.accent },
  picker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  remove: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  numbers: { flexDirection: 'row', gap: 8 },
  numberField: { flex: 1, gap: 4 },
  numberLabel: { fontSize: 10 },
  numberInput: {
    height: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    color: colors.textPrimary,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 15,
  },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  addText: { color: colors.accent },
});
