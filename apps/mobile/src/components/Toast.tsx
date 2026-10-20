import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useToast } from '../stores/toast';
import { colors, radius } from '../theme';
import { Text } from './Text';

export function Toast() {
  const insets = useSafeAreaInsets();
  const { message, hide } = useToast();
  if (!message) return null;
  return (
    <Pressable
      onPress={hide}
      accessibilityRole="alert"
      style={[styles.toast, { top: insets.top + 8 }]}
    >
      <Text style={styles.text}>{message}</Text>
      <X size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(175,145,80,0.4)',
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingVertical: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  text: { flex: 1 },
});
