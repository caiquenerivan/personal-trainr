import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from './api';
import { kvStorage } from './kvStorage';

type NotificationsModule = typeof import('expo-notifications');

// O módulo nativo só existe em builds feitos depois de instalar o
// expo-notifications; num build antigo, o app segue sem notificações em vez
// de fechar ao abrir.
function loadModule(): NotificationsModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- import condicional (ver acima)
    return require('expo-notifications') as NotificationsModule;
  } catch {
    return null;
  }
}

export const Notifications = loadModule();

const PUSH_TOKEN_KEY = 'personaltrainr.pushToken';
const REMINDER_KEY = 'personaltrainr.reminder';
const REMINDER_ID = 'daily-reminder';

export type ReminderSettings = { enabled: boolean; hour: number; minute: number };

if (Notifications) {
  Notifications.setNotificationHandler({
    // Com o app aberto o descanso já avisa na tela (contador + vibração);
    // o resto aparece como banner normal.
    handleNotification: async (notification) => {
      const isRest = notification.request.content.data?.kind === 'rest';
      return { shouldShowBanner: !isRest, shouldShowList: !isRest, shouldPlaySound: !isRest, shouldSetBadge: false };
    },
  });
}

async function ensureChannels() {
  if (!Notifications || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Treinos e alunos',
    importance: Notifications.AndroidImportance.HIGH,
  });
  await Notifications.setNotificationChannelAsync('rest', {
    name: 'Fim do descanso',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 300, 150, 300],
  });
}

async function ensurePermission(): Promise<boolean> {
  if (!Notifications) return false;
  await ensureChannels(); // no Android 13+, o pedido só aparece depois de existir um canal
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

// Registra o aparelho para receber push. Falha em silêncio: sem permissão,
// sem Firebase configurado no build ou sem internet, o app só não recebe push.
export async function registerPushToken(): Promise<void> {
  if (!Notifications) return;
  try {
    if (!(await ensurePermission())) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.post('/api/notifications/token', { token, platform: Platform.OS });
    kvStorage.setItem(PUSH_TOKEN_KEY, token);
  } catch {
    // ver comentário acima
  }
}

// Antes de sair da conta: este aparelho para de receber push dela.
export async function unregisterPushToken(): Promise<void> {
  const token = kvStorage.getItem(PUSH_TOKEN_KEY);
  if (!token) return;
  kvStorage.removeItem(PUSH_TOKEN_KEY);
  await Promise.race([
    api.post('/api/notifications/token/remove', { token }).catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 3000)), // sem sinal, não segura o logout
  ]);
}

// ─── Fim do descanso (notificação local) ──────────────────────────────────

export async function scheduleRestEnd(seconds: number): Promise<string | null> {
  if (!Notifications || seconds < 3) return null;
  try {
    if (!(await ensurePermission())) return null;
    return await Notifications.scheduleNotificationAsync({
      content: { title: 'Descanso terminado', body: 'Hora da próxima série!', data: { kind: 'rest' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, channelId: 'rest' },
    });
  } catch {
    return null;
  }
}

export function cancelScheduled(id: string | null) {
  if (id && Notifications) Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

// ─── Lembrete diário de treino (notificação local) ────────────────────────

export function getReminderSettings(): ReminderSettings {
  try {
    const raw = kvStorage.getItem(REMINDER_KEY);
    if (raw) return JSON.parse(raw) as ReminderSettings;
  } catch {
    // padrão abaixo
  }
  return { enabled: false, hour: 18, minute: 0 };
}

// Devolve false se o usuário negou a permissão de notificações.
export async function saveReminderSettings(settings: ReminderSettings): Promise<boolean> {
  if (!Notifications) return false;
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
  if (settings.enabled) {
    if (!(await ensurePermission())) return false;
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_ID,
      content: { title: 'Hora do treino', body: 'Seu treino de hoje está te esperando.', data: { url: '/' } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.hour,
        minute: settings.minute,
        channelId: 'default',
      },
    });
  }
  kvStorage.setItem(REMINDER_KEY, JSON.stringify(settings));
  return true;
}

// Ao sair da conta: o lembrete é deste usuário, não do aparelho.
export async function clearLocalNotifications() {
  kvStorage.removeItem(REMINDER_KEY);
  await Notifications?.cancelAllScheduledNotificationsAsync().catch(() => {});
}
