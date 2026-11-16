import { Share, StyleSheet, View } from 'react-native';
import { Link2, Share2 } from 'lucide-react-native';
import { WEB_URL } from '../../lib/config';
import { useAuth } from '../../stores/auth';
import { Button } from '../../components/Button';
import { Text } from '../../components/Text';
import { colors, fonts, radius } from '../../theme';

// Link que o personal manda para o aluno: abre /convite/:username no site,
// onde o aluno cria a conta (ou entra) e já fica vinculado ao personal.
export function InviteLinkCard() {
  const user = useAuth((s) => s.user);
  if (user?.role !== 'TRAINER') return null;

  const url = user.username ? `${WEB_URL}/convite/${encodeURIComponent(user.username)}` : null;

  function share() {
    if (!url) return;
    Share.share({ message: `Treine comigo no Personal Trainr! Crie sua conta pelo link: ${url}` }).catch(() => {});
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Link2 size={18} color={colors.accent} />
        <View style={styles.flex}>
          <Text style={styles.title}>Link de convite</Text>
          <Text style={styles.muted}>
            {url
              ? 'Ao criar a conta por ele, o aluno já fica vinculado a você.'
              : 'Defina um username no seu perfil do site para gerar o link.'}
          </Text>
        </View>
      </View>
      {url && (
        <>
          <Text style={styles.url} selectable numberOfLines={1}>
            {url.replace(/^https?:\/\//, '')}
          </Text>
          <Button title="Compartilhar link" icon={<Share2 size={16} color={colors.black} />} onPress={share} />
        </>
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
  url: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.base,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
});
