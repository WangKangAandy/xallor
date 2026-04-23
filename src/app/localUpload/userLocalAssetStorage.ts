import { MAX_STORED_DATA_URL_CHARS } from "./constants";

function isLikelyImageDataUrl(value: string): boolean {
  return value.startsWith("data:image/");
}

/** 从 localStorage 读取已保存的 Data URL，非法或过长则视为无。 */
export function loadStoredDataUrl(storageKey: string): string | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw || !isLikelyImageDataUrl(raw)) return null;
    if (raw.length > MAX_STORED_DATA_URL_CHARS) return null;
    return raw;
  } catch {
    return null;
  }
}

export function persistDataUrl(storageKey: string, dataUrl: string): void {
  if (!isLikelyImageDataUrl(dataUrl)) return;
  if (dataUrl.length > MAX_STORED_DATA_URL_CHARS) {
    throw new RangeError("stored image too large");
  }
  localStorage.setItem(storageKey, dataUrl);
}

export function clearStoredKey(storageKey: string): void {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    /* ignore */
  }
}
