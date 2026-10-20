import { memo } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { CheckSquare, Square } from 'lucide-react-native';
import type { RoutineExercise } from '@personaltrainr/shared';
import { Text } from '../../components/Text';
import { colors, fonts, radius, touchTarget } from '../../theme';

type ExerciseRowProps = {
  item: RoutineExercise;
  checked: boolean;
  weight: string;
  onToggle: (item: RoutineExercise) => void;
  onWeightChange: (id: string, value: string) => void;
  onOpenDetail: (item: RoutineExercise) => void;
};

// Linha do "Treino do dia" do painel web. No web a carga some no celular
// (hidden sm:block); no app ela fica visível, porque é aqui que o aluno
// registra a carga na academia.
export const ExerciseRow = memo(function ExerciseRow({
  item,
  checked,
  weight,
  onToggle,
  onWeightChange,
  onOpenDetail,
}: ExerciseRowProps) {
  return (
    <Pressable
      onPress={() => onOpenDetail(item)}
      accessibilityRole="button"
      accessibilityHint="Abre os detalhes do exercício"
      style={({ pressed }) => [styles.row, checked ? styles.rowChecked : styles.rowIdle, pressed && styles.rowPressed]}
    >
      <Pressable
        onPress={() => onToggle(item)}
        hitSlop={8}
        style={styles.check}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={`Concluir ${item.exercise.name}`}
      >
        {checked ? <CheckSquare size={24} color={colors.accent} /> : <Square size={24} color={colors.textSecondary} />}
      </Pressable>

      <View style={styles.info}>
        <Text numberOfLines={2} style={[styles.name, checked && styles.nameChecked]}>
          {item.exercise.name}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.metric}>{item.series}x</Text>
          <Text style={styles.metric}>{item.reps} reps</Text>
          <View style={styles.restChip}>
            <Text style={styles.restText}>Descanso: {item.restTime}s</Text>
          </View>
        </View>
      </View>

      <TextInput
        value={weight}
        onChangeText={(v) => onWeightChange(item.id, v)}
        placeholder="Carga"
        placeholderTextColor={colors.textSecondary}
        keyboardType="decimal-pad"
        selectionColor={colors.accent}
        maxLength={6}
        style={styles.weight}
        accessibilityLabel={`Carga em kg de ${item.exercise.name}`}
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingVertical: 12,
    paddingLeft: 8,
    paddingRight: 12,
  },
  rowIdle: { borderColor: 'rgba(74,74,74,0.4)', backgroundColor: 'rgba(51,51,51,0.4)' },
  rowChecked: { borderColor: 'rgba(175,145,80,0.3)', backgroundColor: 'rgba(175,145,80,0.05)' },
  rowPressed: { borderColor: 'rgba(175,145,80,0.4)' },
  check: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, minWidth: 0, gap: 4 },
  name: { fontFamily: fonts.bodyBold, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  nameChecked: { color: colors.textSecondary, textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 4 },
  metric: { fontFamily: fonts.number, fontSize: 12, color: 'rgba(175,145,80,0.8)' },
  restChip: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(74,74,74,0.3)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  restText: { fontSize: 10, color: colors.textSecondary },
  weight: {
    width: 64,
    height: touchTarget,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.base,
    color: colors.textPrimary,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 13,
  },
});
