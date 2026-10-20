import { Pressable, StyleSheet, View } from 'react-native';
import type { Day } from '@personaltrainr/shared';
import { Text } from '../../components/Text';
import { colors, fonts, radius } from '../../theme';

export function LetterSelector({
  days,
  selected,
  hasExercises,
  onSelect,
}: {
  days: Day[];
  selected: Day;
  hasExercises: (day: Day) => boolean;
  onSelect: (day: Day) => void;
}) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Selecione o Treino</Text>
      <View style={styles.bar}>
        {days.map((day) => {
          const active = day === selected;
          return (
            <Pressable
              key={day}
              onPress={() => onSelect(day)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Treino ${day}`}
              style={({ pressed }) => [styles.letter, active && styles.letterActive, pressed && styles.pressed]}
            >
              <Text style={[styles.letterText, active && styles.letterTextActive]}>{day}</Text>
              {hasExercises(day) && <View style={[styles.dot, { backgroundColor: active ? colors.black : colors.accent }]} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 12 },
  label: { fontFamily: fonts.bodyBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: colors.textSecondary },
  bar: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(74,74,74,0.2)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  letter: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg },
  letterActive: { backgroundColor: colors.accent },
  pressed: { transform: [{ scale: 0.95 }] },
  letterText: { fontFamily: fonts.title, fontSize: 16, color: colors.textSecondary },
  letterTextActive: { color: colors.black },
  dot: { position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: 3 },
});
