import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Timer } from 'lucide-react-native';
import { Text } from '../../components/Text';
import { colors, fonts, radius } from '../../theme';

// Contagem do descanso depois de marcar um exercício. Usa o horário de fim
// (e não um contador) para continuar certo se o app for para segundo plano.
export function RestTimer({ endsAt, onDone }: { endsAt: number | null; onDone: () => void }) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const left = endsAt - Date.now();
      setRemainingMs(left);
      if (left <= 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        onDoneRef.current();
      }
    };
    const id = setInterval(tick, 250);
    const first = setTimeout(tick, 0);
    return () => {
      clearInterval(id);
      clearTimeout(first);
    };
  }, [endsAt]);

  if (!endsAt || remainingMs === null || remainingMs <= 0) return null;

  const total = Math.ceil(remainingMs / 1000);
  const label = `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;

  return (
    <View style={styles.bar} accessibilityLiveRegion="polite">
      <Timer size={18} color={colors.accent} />
      <Text style={styles.label}>Descanso</Text>
      <Text style={styles.time}>{label}</Text>
      <Pressable onPress={onDone} hitSlop={8} accessibilityRole="button">
        <Text style={styles.skip}>Pular</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(175,145,80,0.4)',
    backgroundColor: colors.menu,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: { flex: 1, fontSize: 12, textTransform: 'uppercase', color: colors.textSecondary },
  time: { fontFamily: fonts.number, fontSize: 20, color: colors.accent },
  skip: { fontSize: 12, textTransform: 'uppercase', color: colors.textSecondary, textDecorationLine: 'underline' },
});
