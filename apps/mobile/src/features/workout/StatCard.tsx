import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { colors, fonts, radius } from '../../theme';

export function StatCard({
  icon: Icon,
  color,
  label,
  value,
  unit,
  numeric = true,
}: {
  icon: LucideIcon;
  color: string;
  label: string;
  value: string;
  unit?: string;
  numeric?: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={[styles.icon, { backgroundColor: `${color}1A` }]}>
        <Icon size={24} color={color} />
      </View>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueRow}>
          <Text numberOfLines={1} style={numeric ? styles.number : styles.word}>
            {value}
          </Text>
          {unit && <Text style={styles.unit}>{unit}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(74,74,74,0.4)',
    backgroundColor: colors.card,
    padding: 16,
  },
  icon: { width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0 },
  label: { fontFamily: fonts.bodyBold, fontSize: 10, textTransform: 'uppercase', color: colors.textSecondary },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  number: { fontFamily: fonts.number, fontSize: 22, color: colors.accent },
  word: { fontFamily: fonts.bodyBold, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  unit: { fontSize: 10, color: colors.textSecondary },
});
