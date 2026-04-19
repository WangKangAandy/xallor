/**
 * 与 `index.html` 内联首屏脚本算法一致；改解析规则时请双改并跑单测。
 * @see docs/notes/theme-color-scheme-implementation-plan.md
 */
import { parseStoredColorScheme, UI_COLOR_SCHEME_STORAGE_KEY } from "../preferences/colorSchemeStorage";
import { applyColorScheme } from "./applyColorScheme";
import { matchesPrefersColorSchemeDark, resolveColorScheme } from "./resolveColorScheme";

export function getInitialResolvedSchemeSync(): ReturnType<typeof resolveColorScheme> {
  const raw = globalThis.localStorage?.getItem(UI_COLOR_SCHEME_STORAGE_KEY) ?? null;
  const preference = parseStoredColorScheme(raw);
  return resolveColorScheme(preference, matchesPrefersColorSchemeDark());
}

/** 在 `createRoot` 前调用，与首屏内联脚本互补并同步 JS 模块内 lastApplied 状态。 */
export function initColorScheme(): void {
  applyColorScheme(getInitialResolvedSchemeSync());
}
