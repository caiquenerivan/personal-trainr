import type { ReactNode } from 'react';
import { RefreshControl, StyleSheet } from 'react-native';
import Animated, { type AnimatedRef } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

// Tela rolável com "puxar para atualizar".
export function ScrollScreen({
  children,
  refreshing = false,
  onRefresh,
  scrollRef,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  // para telas que rolam a página por conta própria (ex.: arrastar para reordenar)
  scrollRef?: AnimatedRef<Animated.ScrollView>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Animated.ScrollView
      ref={scrollRef}
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
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.panel },
  content: { gap: 20, paddingHorizontal: 16, paddingTop: 8 },
});
