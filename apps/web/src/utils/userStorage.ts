function getUserId(): string | null {
  try {
    const raw = window.localStorage.getItem('personaltrainr.user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export function getUserKey(suffix: string): string {
  const userId = getUserId();
  return userId ? `personaltrainr.${suffix}_${userId}` : `personaltrainr.${suffix}`;
}

export function userGet(suffix: string): string | null {
  return window.localStorage.getItem(getUserKey(suffix));
}

export function userSet(suffix: string, value: string): void {
  window.localStorage.setItem(getUserKey(suffix), value);
}

export function userRemove(suffix: string): void {
  window.localStorage.removeItem(getUserKey(suffix));
}

export function clearUserData(): void {
  const userId = getUserId();
  if (!userId) return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.includes(userId)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => window.localStorage.removeItem(k));
}
