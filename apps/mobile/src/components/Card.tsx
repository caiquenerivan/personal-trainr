import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

// Equivalente ao "rounded-2xl bg-card border border-border/60 p-4" do web.
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(74,74,74,0.6)',
    backgroundColor: colors.card,
    padding: 16,
  },
});
