import { Drawer } from 'expo-router/drawer';
import { useAuth } from '../../stores/auth';
import { useSyncTriggers } from '../../hooks/useSyncTriggers';
import { useNotificationSetup } from '../../hooks/useNotificationSetup';
import { usePremiumSetup } from '../../hooks/usePremiumSetup';
import { AppHeader } from '../../components/AppHeader';
import { DrawerContent } from '../../components/DrawerContent';
import { Toast } from '../../components/Toast';
import { colors } from '../../theme';

export default function AppLayout() {
  const role = useAuth((s) => s.user?.role);
  const isTrainer = role === 'TRAINER';
  useSyncTriggers();
  useNotificationSetup();
  usePremiumSetup();

  return (
    <>
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        header: (props) => <AppHeader {...props} />,
        drawerStyle: { backgroundColor: colors.menu, width: 288, maxWidth: '85%' },
        overlayColor: colors.overlay,
        sceneStyle: { backgroundColor: colors.panel },
      }}
    >
      <Drawer.Screen name="index" />
      <Drawer.Screen name="evolucao" />
      <Drawer.Screen name="perfil" />
      <Drawer.Protected guard={!isTrainer}>
        <Drawer.Screen name="personal" />
      </Drawer.Protected>
      <Drawer.Protected guard={isTrainer}>
        <Drawer.Screen name="alunos" />
        <Drawer.Screen name="rotinas" />
        <Drawer.Screen name="exercicios" />
        <Drawer.Screen name="meu-treino" />
        <Drawer.Screen name="progresso" />
      </Drawer.Protected>
    </Drawer>
    <Toast />
    </>
  );
}
