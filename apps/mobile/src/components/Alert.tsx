import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme';
import { Text } from './Text';

// Mesmo visual dos avisos do login web: borda neutra, texto em accent.
export function Alert({ children, action }: { children: string; action?: ReactNode }) {
  return (
    <View accessibilityRole="alert" style={styles.box}>
      <Text style={styles.text}>{children}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: { color: colors.accent },
});
