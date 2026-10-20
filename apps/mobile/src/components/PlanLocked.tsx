import { StyleSheet, View } from 'react-native';
import { Lock } from 'lucide-react-native';
import { colors, radius } from '../theme';
import { Text } from './Text';

// Sem botão de upgrade nem menção a preço: as lojas não permitem direcionar
// para compra fora do app, e a assinatura é feita só pelo site.
export function PlanLocked({ title }: { title: string }) {
  return (
    <View style={styles.box}>
      <View style={styles.icon}>
        <Lock size={28} color={colors.accent} />
      </View>
      <Text variant="title" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.text}>Este recurso não está incluído no plano atual da sua conta.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: 12, paddingVertical: 48, paddingHorizontal: 16 },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(175,145,80,0.1)',
  },
  title: { fontSize: 22, textAlign: 'center' },
  text: { textAlign: 'center', color: colors.textSecondary, lineHeight: 20, maxWidth: 320 },
});
