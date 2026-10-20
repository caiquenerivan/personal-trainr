import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { colors, fonts, touchTarget } from '../theme';
import { Text } from './Text';

// Cabeçalho das páginas do web: rótulo dourado, título grande e descrição,
// com voltar opcional (as telas internas, como "Detalhes da rotina").
export function PageHeader({
  eyebrow,
  title,
  description,
  onBack,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  onBack?: () => void;
  action?: ReactNode;
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {onBack && (
          <Pressable onPress={onBack} style={styles.back} accessibilityRole="button" accessibilityLabel="Voltar">
            <ArrowLeft size={20} color={colors.accent} />
          </Pressable>
        )}
        <View style={styles.texts}>
          {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
          <Text variant="title" style={styles.title}>
            {title}
          </Text>
        </View>
      </View>
      {description && <Text style={styles.description}>{description}</Text>}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center', marginLeft: -10 },
  texts: { flex: 1, gap: 6 },
  eyebrow: { fontFamily: fonts.bodyBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 3, color: colors.accent },
  title: { fontSize: 30 },
  description: { fontSize: 13, lineHeight: 20, color: colors.textSecondary },
});
