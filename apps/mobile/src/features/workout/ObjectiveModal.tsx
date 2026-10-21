import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { OBJECTIVES, type UserData } from '@personaltrainr/shared';
import { api, getErrorMessage } from '../../lib/api';
import { useAuth } from '../../stores/auth';
import { showToast } from '../../stores/toast';
import { AppModal } from '../../components/AppModal';
import { Text } from '../../components/Text';
import { colors, radius } from '../../theme';

// Escolha do objetivo de treino (salvo no perfil, vale também no site).
export function ObjectiveModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const [saving, setSaving] = useState<string | null>(null);

  async function choose(objective: string) {
    setSaving(objective);
    try {
      const response = await api.put<{ user: UserData }>('/api/users/profile', { objective });
      await setUser({ ...user!, ...response.data.user });
      onClose();
    } catch (err) {
      showToast(getErrorMessage(err, 'Não foi possível salvar o objetivo.'));
    } finally {
      setSaving(null);
    }
  }

  return (
    <AppModal open={open} onClose={onClose} title="Seu objetivo">
      <View style={styles.list}>
        {OBJECTIVES.map((objective) => {
          const active = user?.objective === objective;
          return (
            <Pressable
              key={objective}
              onPress={() => choose(objective)}
              disabled={!!saving}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [styles.option, active && styles.optionActive, pressed && styles.pressed]}
            >
              <Text style={[styles.label, active && styles.labelActive]}>{objective}</Text>
              {active && <Check size={16} color={colors.accent} />}
              {saving === objective && <Text style={styles.saving}>Salvando...</Text>}
            </Pressable>
          );
        })}
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.base,
    paddingHorizontal: 14,
  },
  optionActive: { borderColor: colors.accent },
  pressed: { opacity: 0.85 },
  label: { flex: 1 },
  labelActive: { color: colors.accent },
  saving: { fontSize: 12, color: colors.textSecondary },
});
