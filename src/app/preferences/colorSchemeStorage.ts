/**
 * 主题偏好持久化键与解析（无 React 依赖，供 theme runtime 与 UiPreferences 共用）。
 */

export const UI_COLOR_SCHEME_STORAGE_KEY = "xallor_ui_color_scheme";

export type ColorSchemePreference = "light" | "dark" | "system";

/** 非法或缺失时回退 `system`，与首屏内联脚本须保持算法一致。 */
export function parseStoredColorScheme(raw: string | null): ColorSchemePreference {
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}
