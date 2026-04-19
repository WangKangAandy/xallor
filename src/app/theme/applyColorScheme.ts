import type { ResolvedColorScheme } from "./resolveColorScheme";

export const XALLOR_THEME_CHANGE_EVENT = "xallor:theme-change";

export type XallorThemeChangeDetail = { resolved: ResolvedColorScheme };

let lastAppliedResolved: ResolvedColorScheme | null = null;

/**
 * 将解析后的亮/暗应用到 `<html>`：`class` 含 `dark` + `color-scheme`。
 * 幂等：与上次已应用值相同则早退（不写 DOM、不派发事件）。
 * 事件：仅当「上次已成功 apply 的值」存在且与本次不同时派发 `xallor:theme-change`（首帧 bootstrap 不派发）。
 */
export function applyColorScheme(resolved: ResolvedColorScheme): void {
  if (lastAppliedResolved === resolved) {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;

  const prev = lastAppliedResolved;
  lastAppliedResolved = resolved;

  if (prev !== null) {
    globalThis.dispatchEvent(
      new CustomEvent<XallorThemeChangeDetail>(XALLOR_THEME_CHANGE_EVENT, {
        detail: { resolved },
      }),
    );
  }
}

/** 单测之间重置模块态，避免顺序依赖。 */
export function __resetApplyColorSchemeStateForTests(): void {
  lastAppliedResolved = null;
}
