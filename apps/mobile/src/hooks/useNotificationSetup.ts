import { useEffect } from 'react';
import { router } from 'expo-router';
import { Notifications, registerPushToken } from '../lib/notifications';
import { useAuth } from '../stores/auth';

// Registra o aparelho para push ao entrar e abre a tela indicada pela
// notificação tocada (também quando ela abre o app do zero).
export function useNotificationSetup() {
  const userId = useAuth((s) => s.user?.id);

  useEffect(() => {
    if (userId) registerPushToken();
  }, [userId]);

  useEffect(() => {
    if (!Notifications) return;
    const open = (url: unknown) => {
      if (typeof url === 'string' && url.startsWith('/')) router.navigate(url as never);
    };
    const last = Notifications.getLastNotificationResponse();
    if (last) open(last.notification.request.content.data?.url);
    const sub = Notifications.addNotificationResponseReceivedListener((response) =>
      open(response.notification.request.content.data?.url),
    );
    return () => sub.remove();
  }, []);
}
