import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors, fonts, radius } from '../theme';

export function SearchInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.box}>
      <Search size={16} color={colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        selectionColor={colors.accent}
        returnKeyType="search"
        style={styles.input}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityLabel="Limpar busca">
          <X size={16} color={colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.base,
    paddingHorizontal: 12,
  },
  input: { flex: 1, height: 48, color: colors.textPrimary, fontFamily: fonts.body, fontSize: 15 },
});
