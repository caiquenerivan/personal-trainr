import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useAuth } from '../../stores/auth';
import { WEB_URL } from '../../lib/config';
import { ROLE_LABELS } from '../../lib/menu';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { Text } from '../../components/Text';
import { DeleteAccountModal } from '../../features/account/DeleteAccountModal';
import { ReminderSettings } from '../../features/account/ReminderSettings';
import { PlanCard } from '../../features/account/PlanCard';
import { colors, radius } from '../../theme';

export default function PerfilScreen() {
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const [deleting, setDeleting] = useState(false);
  if (!user) return null;

  return (
    <Screen>
      <Text variant="title">Perfil</Text>
      <View style={styles.card}>
        <Avatar name={user.name} url={user.avatarUrl} size={64} />
        <View style={styles.info}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.secondary}>{user.email}</Text>
          <Text variant="label" style={styles.role}>
            {ROLE_LABELS[user.role]}
          </Text>
        </View>
      </View>
      <PlanCard />
      <ReminderSettings />
      <Button
        title="Editar perfil no site"
        variant="outline"
        onPress={() => Linking.openURL(`${WEB_URL}/login`)}
      />
      <Button title="Sair" onPress={signOut} />
      <Pressable onPress={() => setDeleting(true)} style={styles.delete} accessibilityRole="button" hitSlop={8}>
        <Text style={styles.deleteText}>Excluir conta</Text>
      </Pressable>
      <DeleteAccountModal open={deleting} onClose={() => setDeleting(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.card,
    padding: 20,
  },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 16 },
  secondary: { color: colors.textSecondary },
  role: { color: colors.accentLight, marginTop: 4 },
  delete: { alignSelf: 'center', paddingVertical: 12 },
  deleteText: { fontSize: 13, color: colors.danger, textDecorationLine: 'underline' },
});
