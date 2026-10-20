import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu } from 'lucide-react-native';
import type { DrawerHeaderProps } from 'expo-router/drawer';
import { colors, touchTarget } from '../theme';

// Igual ao Header mobile do web: só o botão do menu, o título fica na tela.
export function AppHeader({ navigation }: DrawerHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Pressable
        onPress={() => navigation.toggleDrawer()}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Abrir menu"
      >
        <Menu size={24} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.panel, paddingHorizontal: 12, paddingBottom: 4 },
  button: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
});
