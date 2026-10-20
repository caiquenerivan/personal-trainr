import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { colors, fonts, radius } from '../theme';
import { Text } from './Text';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
};

export function Button({ title, onPress, variant = 'primary', loading, disabled, icon }: ButtonProps) {
  const labelColor = variant === 'primary' ? colors.black : variant === 'danger' ? colors.white : colors.textPrimary;
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        inactive && styles.inactive,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, { color: labelColor }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.lg,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.accent },
  outline: { backgroundColor: colors.base, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: '#DC2626' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  inactive: { opacity: 0.7 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: fonts.bodyBold, fontSize: 15, textTransform: 'uppercase' },
});
