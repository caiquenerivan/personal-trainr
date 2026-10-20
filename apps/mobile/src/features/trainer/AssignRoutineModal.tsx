import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useAssignRoutine, useRoutines } from '../../hooks/useTrainerData';
import { getErrorMessage } from '../../lib/api';
import { showToast } from '../../stores/toast';
import { AppModal } from '../../components/AppModal';
import { Button } from '../../components/Button';
import { Chips } from '../../components/Chips';
import { Text } from '../../components/Text';
import { TextField } from '../../components/TextField';
import { colors, radius } from '../../theme';

const WEEKLY_GOALS = [2, 3, 4, 5, 6] as const;

// Modal "Vincular Rotina" do web: rotina, validade em dias e meta semanal.
// Com fixedRoutineId (tela da rotina), escolhe-se o aluno em vez da rotina.
export function AssignRoutineModal({
  open,
  onClose,
  alunoId,
  fixedRoutineId,
  studentOptions,
}: {
  open: boolean;
  onClose: () => void;
  alunoId?: string;
  fixedRoutineId?: string;
  studentOptions?: { id: string; name: string }[];
}) {
  const routines = useRoutines();
  const assign = useAssignRoutine();
  const [routineId, setRoutineId] = useState<string | null>(fixedRoutineId ?? null);
  const [studentId, setStudentId] = useState<string | null>(alunoId ?? null);
  const [days, setDays] = useState('30');
  const [weeklyGoal, setWeeklyGoal] = useState<number>(3);

  function close() {
    setRoutineId(fixedRoutineId ?? null);
    setStudentId(alunoId ?? null);
    setDays('30');
    setWeeklyGoal(3);
    onClose();
  }

  async function submit() {
    const validity = Number(days);
    if (!routineId || !studentId || !Number.isInteger(validity) || validity < 1) return;
    try {
      await assign.mutateAsync({ routineId, alunoId: studentId, days: validity, weeklyGoal });
      showToast('Rotina vinculada com sucesso!');
      close();
    } catch (err) {
      showToast(getErrorMessage(err, 'Erro ao vincular rotina'));
    }
  }

  const options = fixedRoutineId
    ? (studentOptions ?? []).map((s) => ({ id: s.id, label: s.name }))
    : (routines.data ?? []).map((r) => ({ id: r.id, label: `${r.name} (${r.type})` }));
  const selected = fixedRoutineId ? studentId : routineId;
  const select = fixedRoutineId ? setStudentId : setRoutineId;

  return (
    <AppModal open={open} onClose={close} title="Vincular Rotina">
      <View style={styles.field}>
        <Text variant="label">{fixedRoutineId ? 'Aluno' : 'Rotina'}</Text>
        {options.length === 0 ? (
          <Text style={styles.empty}>
            {fixedRoutineId ? 'Nenhum aluno conectado a você ainda.' : 'Nenhuma rotina encontrada. Crie uma primeiro.'}
          </Text>
        ) : (
          <View style={styles.options}>
            {options.map((o) => {
              const active = o.id === selected;
              return (
                <Pressable
                  key={o.id}
                  onPress={() => select(o.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={[styles.option, active && styles.optionActive]}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]} numberOfLines={2}>
                    {o.label}
                  </Text>
                  {active && <Check size={16} color={colors.accent} />}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <TextField
        label="Validade do treino (em dias)"
        value={days}
        onChangeText={(v) => setDays(v.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={3}
      />

      <View style={styles.field}>
        <Text variant="label">Meta de treinos por semana</Text>
        <Chips options={WEEKLY_GOALS} value={weeklyGoal as (typeof WEEKLY_GOALS)[number]} onChange={setWeeklyGoal} label={(n) => `${n}x`} />
      </View>

      <Button
        title="Vincular"
        onPress={submit}
        loading={assign.isPending}
        disabled={!routineId || !studentId || !(Number(days) >= 1)}
      />
      <Button title="Cancelar" variant="outline" onPress={close} />
    </AppModal>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  empty: { color: colors.textSecondary },
  options: { gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.base,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionActive: { borderColor: colors.accent },
  optionText: { flex: 1 },
  optionTextActive: { color: colors.accent },
});
