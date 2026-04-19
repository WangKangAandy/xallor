import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { applyColorScheme, subscribePrefersColorSchemeChange } from "../theme";
import { matchesPrefersColorSchemeDark, resolveColorScheme } from "../theme/resolveColorScheme";
import type { LayoutMode } from "./layoutTypes";
import {
  parseStoredColorScheme,
  UI_COLOR_SCHEME_STORAGE_KEY,
  type ColorSchemePreference,
} from "./colorSchemeStorage";

export type { ColorSchemePreference } from "./colorSchemeStorage";
export { parseStoredColorScheme, UI_COLOR_SCHEME_STORAGE_KEY } from "./colorSchemeStorage";

export const UI_LAYOUT_STORAGE_KEY = "xallor_ui_layout";
export const UI_OPEN_LINKS_IN_NEW_TAB_STORAGE_KEY = "xallor_ui_open_links_in_new_tab";

/** 供单测与存储迁移；非法值一律回退 default。 */
export function parseStoredLayoutMode(raw: string | null): LayoutMode {
  if (raw === "minimal") return "minimal";
  return "default";
}

/** 仅 `"0"` 为当前标签；其余一律为 `true`（新标签，默认）。 */
export function parseStoredOpenLinksInNewTab(raw: string | null): boolean {
  if (raw === "0") return false;
  return true;
}

function readInitialLayoutMode(): LayoutMode {
  return parseStoredLayoutMode(globalThis.localStorage?.getItem(UI_LAYOUT_STORAGE_KEY) ?? null);
}

function readInitialOpenLinksInNewTab(): boolean {
  return parseStoredOpenLinksInNewTab(
    globalThis.localStorage?.getItem(UI_OPEN_LINKS_IN_NEW_TAB_STORAGE_KEY) ?? null,
  );
}

function readInitialColorScheme(): ColorSchemePreference {
  return parseStoredColorScheme(globalThis.localStorage?.getItem(UI_COLOR_SCHEME_STORAGE_KEY) ?? null);
}

export type UiPreferencesContextValue = {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  openLinksInNewTab: boolean;
  setOpenLinksInNewTab: (value: boolean) => void;
  colorScheme: ColorSchemePreference;
  setColorScheme: (pref: ColorSchemePreference) => void;
};

const UiPreferencesContext = createContext<UiPreferencesContextValue | null>(null);

/**
 * UI 偏好 Provider：全应用单例状态，供 SearchBar / 网格等与设置共享。
 * 持久化仅在用户调用 setter 时写入，避免 useEffect 与外部 localStorage 竞态。
 * 主题：`colorScheme` 变更后由 `useLayoutEffect` 调用 `applyColorScheme`；`system` 时单独订阅 `prefers-color-scheme`。
 */
export function UiPreferencesProvider({ children }: { children: ReactNode }) {
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>(() => readInitialLayoutMode());
  const [openLinksInNewTab, setOpenLinksInNewTabState] = useState<boolean>(() =>
    readInitialOpenLinksInNewTab(),
  );
  const [colorScheme, setColorSchemeState] = useState<ColorSchemePreference>(() => readInitialColorScheme());
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => matchesPrefersColorSchemeDark());

  useEffect(() => {
    if (colorScheme === "system") {
      setSystemPrefersDark(matchesPrefersColorSchemeDark());
    }
  }, [colorScheme]);

  useEffect(() => {
    if (colorScheme !== "system") return;
    return subscribePrefersColorSchemeChange(setSystemPrefersDark);
  }, [colorScheme]);

  const resolvedColorScheme = useMemo(
    () => resolveColorScheme(colorScheme, systemPrefersDark),
    [colorScheme, systemPrefersDark],
  );

  useLayoutEffect(() => {
    applyColorScheme(resolvedColorScheme);
  }, [resolvedColorScheme]);

  const setLayoutMode = useCallback((mode: LayoutMode) => {
    setLayoutModeState(mode);
    globalThis.localStorage?.setItem(UI_LAYOUT_STORAGE_KEY, mode);
  }, []);

  const setOpenLinksInNewTab = useCallback((value: boolean) => {
    setOpenLinksInNewTabState(value);
    globalThis.localStorage?.setItem(UI_OPEN_LINKS_IN_NEW_TAB_STORAGE_KEY, value ? "1" : "0");
  }, []);

  const setColorScheme = useCallback((pref: ColorSchemePreference) => {
    setColorSchemeState(pref);
    globalThis.localStorage?.setItem(UI_COLOR_SCHEME_STORAGE_KEY, pref);
  }, []);

  const value = useMemo(
    () => ({
      layoutMode,
      setLayoutMode,
      openLinksInNewTab,
      setOpenLinksInNewTab,
      colorScheme,
      setColorScheme,
    }),
    [layoutMode, setLayoutMode, openLinksInNewTab, setOpenLinksInNewTab, colorScheme, setColorScheme],
  );

  return <UiPreferencesContext.Provider value={value}>{children}</UiPreferencesContext.Provider>;
}

export function useUiPreferences(): UiPreferencesContextValue {
  const ctx = useContext(UiPreferencesContext);
  if (!ctx) {
    throw new Error("useUiPreferences must be used within UiPreferencesProvider");
  }
  return ctx;
}
