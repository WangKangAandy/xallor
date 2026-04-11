/**
 * 多桌面每一页的持久稳定 id（React key、DnD、删/重排）；与网格项 `id` 无关。
 */
export function newPageId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `page-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** 无持久化时 fallback 首屏的唯一页 id（模块常量，保证首帧 key 稳定）。 */
export const DEFAULT_FIRST_PAGE_ID = "xallor-default-page-1";
