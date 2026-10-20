import { StyleSheet, View } from 'react-native';
import { Trophy } from 'lucide-react-native';
import { AppModal } from '../../components/AppModal';
import { Button } from '../../components/Button';
import { Text } from '../../components/Text';
import { colors, fonts, radius } from '../../theme';

export function CelebrationModal({
  title,
  pending,
  onClose,
}: {
  title: string | null;
  pending: boolean;
  onClose: () => void;
}) {
  return (
    <AppModal open={!!title} onClose={onClose} title="Treino concluído!">
      <View style={styles.body}>
        <View style={styles.badge}>
          <Trophy size={44} color={colors.accent} />
        </View>
        <Text variant="title">Muito bem!</Text>
        <Text style={styles.workout}>{title}</Text>
        <Text style={styles.quote}>
          &ldquo;O esforço de hoje é o resultado de amanhã. Mantenha a constância e os resultados virão!&rdquo;
        </Text>
        {pending && (
          <Text style={styles.pending}>Sem conexão agora: o treino fica salvo no celular e é enviado sozinho quando voltar a internet.</Text>
        )}
      </View>
      <Button title="Continuar" onPress={onClose} />
    </AppModal>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  badge: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(175,145,80,0.2)',
    backgroundColor: 'rgba(175,145,80,0.1)',
    marginBottom: 8,
  },
  workout: { fontFamily: fonts.bodyBold, fontSize: 13, textTransform: 'uppercase', color: colors.accent, textAlign: 'center' },
  quote: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  pending: { fontSize: 12, color: colors.warning, textAlign: 'center', lineHeight: 18 },
});
