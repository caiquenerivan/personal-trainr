import { prisma } from "./prisma";
import { logger } from "./logger";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK_SIZE = 100; // limite de mensagens por requisição da Expo

export type PushMessage = {
  title: string;
  body: string;
  // repassado ao app; `url` é a tela que abre ao tocar na notificação
  data?: Record<string, unknown>;
};

type ExpoTicket = { status: "ok" | "error"; details?: { error?: string } };

// Envia para todos os aparelhos dos usuários. Nunca lança: notificação é
// acessória e não pode derrubar a requisição que a disparou.
export async function sendPush(userIds: string[], message: PushMessage): Promise<void> {
  if (userIds.length === 0) return;
  try {
    const tokens = await prisma.pushToken.findMany({ where: { userId: { in: userIds } }, select: { token: true } });
    for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
      const chunk = tokens.slice(i, i + CHUNK_SIZE).map((t) => t.token);
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          ...(process.env.EXPO_ACCESS_TOKEN ? { authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}),
        },
        body: JSON.stringify(
          chunk.map((to) => ({ to, sound: "default", channelId: "default", ...message })),
        ),
      });
      if (!response.ok) {
        logger.warn({ status: response.status }, "Expo push request failed");
        continue;
      }
      const { data } = (await response.json()) as { data: ExpoTicket[] };
      // app desinstalado / token inválido: para de mandar para ele
      const dead = chunk.filter((_, idx) => data[idx]?.details?.error === "DeviceNotRegistered");
      if (dead.length) {
        await prisma.pushToken.deleteMany({ where: { token: { in: dead } } });
      }
    }
  } catch (err) {
    logger.error({ err }, "Failed to send push notification");
  }
}
