import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { CloudOff } from 'lucide-react-native';
import { useSyncStatus } from '../stores/syncStatus';
import { colors, radius } from '../theme';
import { Text } from './Text';

// Aparece só quando há exercícios esperando envio.
export function SyncBanner() {
  const { pending, syncing, error } = useSyncStatus();
  if (pending === 0) return null;

  const label = syncing
    ? `Enviando ${pending} ${pending === 1 ? 'exercício' : 'exercícios'}...`
    : `${pending} ${pending === 1 ? 'exercício salvo' : 'exercícios salvos'} no celular. ${
        error === 'offline' ? 'Será enviado quando a internet voltar.' : 'Tentando enviar de novo em breve.'
      }`;

  return (
    <View style={styles.banner} accessibilityLiveRegion="polite">
      {syncing ? <ActivityIndicator size="small" color={colors.warning} /> : <CloudOff size={16} color={colors.warning} />}
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.3)',
    backgroundColor: 'rgba(250,204,21,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: { flex: 1, fontSize: 12, color: colors.warning, lineHeight: 17 },
});
