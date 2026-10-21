import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { buyNoAds, isBillingAvailable, manageSubscription } from '../../lib/billing';
import { getErrorMessage } from '../../lib/api';
import { useAuth } from '../../stores/auth';
import { usePremium } from '../../stores/premium';
import { showToast } from '../../stores/toast';
import { Button } from '../../components/Button';
import { Text } from '../../components/Text';
import { colors, fonts, radius } from '../../theme';

// Plano do aluno no Perfil: grátis (com anúncios) ou Sem Anúncios (Google Play).
export function PlanCard() {
  const user = useAuth((s) => s.user);
  const { isPremium, price } = usePremium();
  const [buying, setBuying] = useState(false);
  if (user?.role !== 'ALUNO' || !isBillingAvailable) return null;

  async function buy() {
    if (!user) return;
    setBuying(true);
    try {
      await buyNoAds(user.id);
    } catch (err) {
      showToast(getErrorMessage(err, err instanceof Error ? err.message : 'Não foi possível abrir a assinatura.'));
    } finally {
      setBuying(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Sparkles size={18} color={colors.accent} />
        <View style={styles.flex}>
          <Text style={styles.title}>{isPremium ? 'Plano Sem Anúncios' : 'Plano Grátis'}</Text>
          <Text style={styles.muted}>
            {isPremium ? 'Assinatura ativa pela Google Play.' : 'Com anúncios ao abrir os exercícios.'}
          </Text>
        </View>
      </View>
      {isPremium ? (
        <Button title="Gerenciar assinatura" variant="outline" onPress={() => manageSubscription().catch(() => {})} />
      ) : (
        <Button title={`Remover anúncios${price ? ` · ${price}/mês` : ''}`} onPress={buy} loading={buying} />
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
