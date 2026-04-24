export type MinimalDockMode = "off" | "auto_hide" | "pinned";

export const UI_MINIMAL_DOCK_MODE_STORAGE_KEY = "xallor_ui_minimal_dock_mode";

/** 旧版布尔存储键，仅用于读取迁移。 */
export const UI_MINIMAL_DOCK_VISIBLE_STORAGE_KEY = "xallor_ui_minimal_dock_visible";

/**
 * 解析持久化的 Dock 模式；新键优先，否则从 legacy `"0"`/`"1"` 迁移。
 * 缺省与旧「开启」一致：`auto_hide`。
 */
export function parseStoredMinimalDockMode(rawMode: string | null, legacyVisible: string | null): MinimalDockMode {
  if (rawMode === "off" || rawMode === "auto_hide" || rawMode === "pinned") return rawMode;
  if (legacyVisible === "0") return "off";
  if (legacyVisible === "1") return "auto_hide";
  return "auto_hide";
}

export function isMinimalDockEnabled(mode: MinimalDockMode): boolean {
  return mode !== "off";
}
