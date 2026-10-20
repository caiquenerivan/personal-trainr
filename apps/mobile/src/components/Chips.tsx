import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { colors, fonts, radius } from '../theme';
import { Text } from './Text';

// Filtros/opções em "pílulas", como TODOS/ATIVOS/INATIVOS do web.
export function Chips<T extends string | number>({
  options,
  value,
  onChange,
  label = (v) => String(v),
  scroll = false,
}: {
  options: readonly T[];
  value: T | null;
  onChange: (value: T) => void;
  label?: (value: T) => string;
  scroll?: boolean;
}) {
  const items = options.map((option) => {
    const active = option === value;
    return (
      <Pressable
        key={String(option)}
        onPress={() => onChange(option)}
        accessibilityRole="radio"
        accessibilityState={{ selected: active }}
        style={({ pressed }) => [styles.chip, active && styles.active, pressed && styles.pressed]}
      >
        <Text style={[styles.text, active && styles.textActive]}>{label(option)}</Text>
      </Pressable>
    );
  });

  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items}
      </ScrollView>
    );
  }
  return <View style={[styles.row, styles.wrap]}>{items}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  wrap: { flexWrap: 'wrap' },
  chip: { minHeight: 40, justifyContent: 'center', borderRadius: radius.lg, backgroundColor: colors.base, paddingHorizontal: 16 },
  active: { backgroundColor: colors.accent },
  pressed: { opacity: 0.85 },
  text: { fontFamily: fonts.bodyBold, fontSize: 12, textTransform: 'uppercase', color: colors.textSecondary },
  textActive: { color: colors.black },
});
