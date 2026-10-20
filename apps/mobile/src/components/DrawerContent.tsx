import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LogOut, X } from 'lucide-react-native';
import type { DrawerContentComponentProps } from 'expo-router/drawer';
import { useAuth } from '../stores/auth';
import { menuForRole, ROLE_LABELS } from '../lib/menu';
import { colors, radius, touchTarget } from '../theme';
import { Avatar } from './Avatar';
import { Text } from './Text';

// Reproduz o menu lateral mobile do web: logo no topo, itens com ícone
// dourado (ativo em bg-base + texto accent) e usuário + Sair no rodapé.
export function DrawerContent({ state, navigation }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  if (!user) return null;

  const activeRoute = state.routes[state.index]?.name;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo-fitness-gold-runner.png')}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="Personal Trainr"
        />
        <Pressable
          onPress={() => navigation.closeDrawer()}
          style={styles.close}
          accessibilityRole="button"
          accessibilityLabel="Fechar menu"
        >
          <X size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView style={styles.nav} contentContainerStyle={styles.navContent}>
        {menuForRole(user.role).map((item) => {
          const active = activeRoute === item.route;
          return (
            <Pressable
              key={item.route}
              onPress={() => navigation.navigate(item.route)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [styles.item, (active || pressed) && styles.itemActive]}
            >
              <item.icon size={18} color={colors.accent} />
              <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.user}>
          <Avatar name={user.name} url={user.avatarUrl} />
          <View style={styles.userText}>
            <Text numberOfLines={1}>{user.name}</Text>
            <Text numberOfLines={1} style={styles.userRole}>
              {ROLE_LABELS[user.role]}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={signOut}
          accessibilityRole="button"
          style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]}
        >
          <LogOut size={18} color={colors.accent} />
          <Text style={styles.itemLabel}>Sair</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.menu, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: { flex: 1, height: 40 },
  close: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  nav: { flex: 1 },
  navContent: { gap: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.xl,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemActive: { backgroundColor: colors.base },
  itemLabel: { fontSize: 14, textTransform: 'uppercase' },
  itemLabelActive: { color: colors.accent },
  footer: { gap: 12, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  user: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  userText: { flex: 1, minWidth: 0 },
  userRole: { fontSize: 11, color: colors.textSecondary },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(74,74,74,0.2)',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoutPressed: { backgroundColor: colors.base, borderColor: 'rgba(175,145,80,0.4)' },
});
