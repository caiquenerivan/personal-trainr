import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

// Tela rolável com "puxar para atualizar".
export function ScrollScreen({
  children,
  refreshing = false,
  onRefresh,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.panel },
  content: { gap: 20, paddingHorizontal: 16, paddingTop: 8 },
});
