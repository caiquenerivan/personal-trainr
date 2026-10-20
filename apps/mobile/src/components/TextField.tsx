import { useState, type Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';
import { colors, fonts, radius } from '../theme';
import { Text } from './Text';

type TextFieldProps = TextInputProps & { label: string; ref?: Ref<TextInputInstance> };

export function TextField({ label, style, onFocus, onBlur, ref, ...props }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text variant="label">{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.accent}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
        style={[styles.input, focused && styles.inputFocused, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  input: {
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.base,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  inputFocused: { borderColor: colors.accent },
});
