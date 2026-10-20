import { Text as RNText, type TextProps, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';

type Variant = 'body' | 'title' | 'number' | 'label';

const variantStyles = StyleSheet.create({
  body: { fontFamily: fonts.body, fontSize: 14, color: colors.textPrimary },
  title: { fontFamily: fonts.title, fontSize: 24, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 1.5 },
  number: { fontFamily: fonts.number, fontSize: 24, color: colors.textPrimary },
  // Equivalente ao "text-xs uppercase text-text-secondary" dos rótulos do web.
  label: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase' },
});

export function Text({ variant = 'body', style, ...props }: TextProps & { variant?: Variant }) {
  return <RNText {...props} style={[variantStyles[variant], style]} />;
}
