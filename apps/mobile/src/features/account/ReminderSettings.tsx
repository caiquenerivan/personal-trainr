import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { getReminderSettings, Notifications, saveReminderSettings } from '../../lib/notifications';
import { showToast } from '../../stores/toast';
import { Chips } from '../../components/Chips';
import { Text } from '../../components/Text';
import { colors, fonts, radius } from '../../theme';

// 05:00 a 22:30, de meia em meia hora
const TIMES = Array.from({ length: 36 }, (_, i) => {
  const minutes = 5 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});

// Lembrete diário de treino (notificação local, neste aparelho).
export function ReminderSettings() {
  const [settings, setSettings] = useState(getReminderSettings);
  if (!Notifications) return null; // build sem o módulo de notificações

  async function apply(next: typeof settings) {
    const ok = await saveReminderSettings(next);
    if (!ok && next.enabled) {
      showToast('Permita as notificações do app nas configurações do celular.');
      return;
    }
    setSettings(next);
  }

  const time = `${String(settings.hour).padStart(2, '0')}:${String(settings.minute).padStart(2, '0')}`;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Bell size={18} color={colors.accent} />
        <View style={styles.flex}>
          <Text style={styles.title}>Lembrete de treino</Text>
          <Text style={styles.muted}>{settings.enabled ? `Todos os dias às ${time}` : 'Desligado'}</Text>
        </View>
        <Switch
          value={settings.enabled}
          onValueChange={(enabled) => apply({ ...settings, enabled })}
          trackColor={{ true: colors.accent, false: colors.border }}
          thumbColor={colors.textPrimary}
          accessibilityLabel="Lembrete diário de treino"
        />
      </View>
      {settings.enabled && (
        <Chips
          scroll
          options={TIMES}
          value={time}
          onChange={(t) => {
            const [hour, minute] = t.split(':').map(Number);
            apply({ ...settings, hour, minute });
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.card,
    padding: 20,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  title: { fontFamily: fonts.bodyBold },
  muted: { fontSize: 12, color: colors.textSecondary },
});
