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
import {
  parseStoredMinimalDockMode,
  UI_MINIMAL_DOCK_MODE_STORAGE_KEY,
  UI_MINIMAL_DOCK_VISIBLE_STORAGE_KEY,
  type MinimalDockMode,
} from "./minimalDockMode";

export type { ColorSchemePreference } from "./colorSchemeStorage";
export { parseStoredColorScheme, UI_COLOR_SCHEME_STORAGE_KEY } from "./colorSchemeStorage";

export const UI_LAYOUT_STORAGE_KEY = "xallor_ui_layout";
export const UI_OPEN_LINKS_IN_NEW_TAB_STORAGE_KEY = "xallor_ui_open_links_in_new_tab";
export const UI_SEARCH_ENGINE_STORAGE_KEY = "xallor_ui_search_engine";
export const UI_SIDEBAR_LAYOUT_STORAGE_KEY = "xallor_ui_sidebar_layout";
export const UI_GRID_ITEM_NAMES_VISIBLE_STORAGE_KEY = "xallor_ui_grid_item_names_visible";

export type SidebarLayoutMode = "auto-hide" | "always-visible";

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

function readInitialSearchEngineId(): string {
  return parseStoredSearchEngineId(globalThis.localStorage?.getItem(UI_SEARCH_ENGINE_STORAGE_KEY) ?? null);
}

function readInitialSidebarLayout(): SidebarLayoutMode {
  return parseStoredSidebarLayout(globalThis.localStorage?.getItem(UI_SIDEBAR_LAYOUT_STORAGE_KEY) ?? null);
}

/** 网格名称显示读取：仅 `"0"` 为隐藏，其余回退显示。 */
export function parseStoredGridItemNamesVisible(raw: string | null): boolean {
  if (raw === "0") return false;
  return true;
}

function readInitialGridItemNamesVisible(): boolean {
  return parseStoredGridItemNamesVisible(
    globalThis.localStorage?.getItem(UI_GRID_ITEM_NAMES_VISIBLE_STORAGE_KEY) ?? null,
  );
}

function readInitialMinimalDockMode(): MinimalDockMode {
  return parseStoredMinimalDockMode(
    globalThis.localStorage?.getItem(UI_MINIMAL_DOCK_MODE_STORAGE_KEY) ?? null,
    globalThis.localStorage?.getItem(UI_MINIMAL_DOCK_VISIBLE_STORAGE_KEY) ?? null,
  );
}

/** 搜索引擎 id 存储读取：允许自定义 id（如 `custom-*`），仅在空值时回退默认。 */
export function parseStoredSearchEngineId(raw: string | null): string {
  if (typeof raw === "string" && raw.trim().length > 0) return raw.trim();
  return "baidu";
}

/** 侧边栏布局读取：非法值回退「常驻（always-visible）」。 */
export function parseStoredSidebarLayout(raw: string | null): SidebarLayoutMode {
  if (raw === "auto-hide" || raw === "always-visible") return raw;
  return "always-visible";
}

export type UiPreferencesContextValue = {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  openLinksInNewTab: boolean;
  setOpenLinksInNewTab: (value: boolean) => void;
  colorScheme: ColorSchemePreference;
  setColorScheme: (pref: ColorSchemePreference) => void;
  sidebarLayout: SidebarLayoutMode;
  setSidebarLayout: (mode: SidebarLayoutMode) => void;
  selectedSearchEngineId: string;
  setSearchEngine: (id: string) => void;
  gridItemNamesVisible: boolean;
  setGridItemNamesVisible: (value: boolean) => void;
  /** 极简布局下 Dock：关闭 / 底部悬停唤出 / 常驻。 */
  minimalDockMode: MinimalDockMode;
  setMinimalDockMode: (mode: MinimalDockMode) => void;
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
  const [sidebarLayout, setSidebarLayoutState] = useState<SidebarLayoutMode>(() => readInitialSidebarLayout());
  const [selectedSearchEngineId, setSelectedSearchEngineId] = useState<string>(() => readInitialSearchEngineId());
  const [gridItemNamesVisible, setGridItemNamesVisibleState] = useState<boolean>(() =>
    readInitialGridItemNamesVisible(),
  );
  const [minimalDockMode, setMinimalDockModeState] = useState<MinimalDockMode>(() => readInitialMinimalDockMode());
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

  const setSidebarLayout = useCallback((mode: SidebarLayoutMode) => {
    setSidebarLayoutState(mode);
    globalThis.localStorage?.setItem(UI_SIDEBAR_LAYOUT_STORAGE_KEY, mode);
  }, []);

  const setSearchEngine = useCallback((id: string) => {
    const resolved = parseStoredSearchEngineId(id);
    setSelectedSearchEngineId(resolved);
    globalThis.localStorage?.setItem(UI_SEARCH_ENGINE_STORAGE_KEY, resolved);
  }, []);

  const setGridItemNamesVisible = useCallback((value: boolean) => {
    setGridItemNamesVisibleState(value);
    globalThis.localStorage?.setItem(UI_GRID_ITEM_NAMES_VISIBLE_STORAGE_KEY, value ? "1" : "0");
  }, []);

  const setMinimalDockMode = useCallback((mode: MinimalDockMode) => {
    setMinimalDockModeState(mode);
    globalThis.localStorage?.setItem(UI_MINIMAL_DOCK_MODE_STORAGE_KEY, mode);
    globalThis.localStorage?.removeItem(UI_MINIMAL_DOCK_VISIBLE_STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      layoutMode,
      setLayoutMode,
      openLinksInNewTab,
      setOpenLinksInNewTab,
      colorScheme,
      setColorScheme,
      sidebarLayout,
      setSidebarLayout,
      selectedSearchEngineId,
      setSearchEngine,
      gridItemNamesVisible,
      setGridItemNamesVisible,
      minimalDockMode,
      setMinimalDockMode,
    }),
    [
      layoutMode,
      setLayoutMode,
      openLinksInNewTab,
      setOpenLinksInNewTab,
      colorScheme,
      setColorScheme,
      sidebarLayout,
      setSidebarLayout,
      selectedSearchEngineId,
      setSearchEngine,
      gridItemNamesVisible,
      setGridItemNamesVisible,
      minimalDockMode,
      setMinimalDockMode,
    ],
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
