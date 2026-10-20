import { Pressable, StyleSheet, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { colors } from '../theme';

// Estrelas com preenchimento parcial (média 4,3 pinta 30% da quinta), como no web.
export function StarRating({
  value,
  onChange,
  size = 20,
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, value - (star - 1)));
        return (
          <Pressable
            key={star}
            disabled={!onChange}
            onPress={() => onChange?.(star)}
            hitSlop={4}
            accessibilityRole={onChange ? 'button' : undefined}
            accessibilityLabel={`${star} estrela${star > 1 ? 's' : ''}`}
            style={{ width: size, height: size }}
          >
            <Star size={size} color={colors.border} style={styles.abs} />
            <View style={[styles.abs, styles.clip, { width: size * fill, height: size }]}>
              <Star size={size} color={colors.accent} fill={colors.accent} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  abs: { position: 'absolute', top: 0, left: 0 },
  clip: { overflow: 'hidden' },
});
