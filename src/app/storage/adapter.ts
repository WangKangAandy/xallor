type ChromeLikeStorage = {
  get: (keys: string | string[], callback?: (items: Record<string, unknown>) => void) => unknown;
  set: (items: Record<string, unknown>, callback?: () => void) => unknown;
};

function getChromeStorage(): ChromeLikeStorage | null {
  const chromeObj = (globalThis as { chrome?: { storage?: { local?: ChromeLikeStorage } } }).chrome;
  return chromeObj?.storage?.local ?? null;
}

export async function readStorageKey<T>(key: string): Promise<T | null> {
  const chromeStorage = getChromeStorage();
  if (chromeStorage) {
    const result = await new Promise<Record<string, unknown>>((resolve) => {
      const maybePromise = chromeStorage.get(key, (items) => resolve(items));
      if (maybePromise && typeof (maybePromise as Promise<Record<string, unknown>>).then === "function") {
        (maybePromise as Promise<Record<string, unknown>>).then(resolve).catch(() => resolve({}));
      }
    });
    return (result[key] as T | undefined) ?? null;
  }

  const raw = globalThis.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeStorageKey<T>(key: string, value: T): Promise<void> {
  const chromeStorage = getChromeStorage();
  if (chromeStorage) {
    await new Promise<void>((resolve) => {
      const maybePromise = chromeStorage.set({ [key]: value }, () => resolve());
      if (maybePromise && typeof (maybePromise as Promise<void>).then === "function") {
        (maybePromise as Promise<void>).then(() => resolve()).catch(() => resolve());
      }
    });
    return;
  }
  globalThis.localStorage.setItem(key, JSON.stringify(value));
}

export function getOrCreateDeviceId(): string {
  const key = "xallor_device_id";
  const existing = globalThis.localStorage.getItem(key);
  if (existing) return existing;

  const generated = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  globalThis.localStorage.setItem(key, generated);
  return generated;
}

