// UUID v4 para o clientId dos registros offline. Usa crypto.randomUUID quando
// o runtime oferece; senão Math.random, que basta para uma chave de
// idempotência entre os poucos registros de um mesmo usuário.
export function uuid(): string {
  const cryptoApi = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
