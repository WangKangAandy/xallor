/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  parseStoredGridItemNamesVisible,
  parseStoredSearchEngineId,
  parseStoredSidebarLayout,
  parseStoredLayoutMode,
  parseStoredOpenLinksInNewTab,
  UI_COLOR_SCHEME_STORAGE_KEY,
  UI_GRID_ITEM_NAMES_VISIBLE_STORAGE_KEY,
  UI_LAYOUT_STORAGE_KEY,
  UI_OPEN_LINKS_IN_NEW_TAB_STORAGE_KEY,
  UI_SEARCH_ENGINE_STORAGE_KEY,
  UI_SIDEBAR_LAYOUT_STORAGE_KEY,
} from "./useUiPreferences";

describe("parseStoredLayoutMode", () => {
  /**
   * 目的：手改 localStorage 或迁移脏数据时不抛错、不进入非法枚举。
   * 预期：仅 `"minimal"` 为极简，其余均 default。
   */
  it("should_fallback_to_default_when_storage_missing_or_invalid", () => {
    expect(parseStoredLayoutMode(null)).toBe("default");
    expect(parseStoredLayoutMode("")).toBe("default");
    expect(parseStoredLayoutMode("garbage")).toBe("default");
    expect(parseStoredLayoutMode("minimal")).toBe("minimal");
  });
});

describe("parseStoredOpenLinksInNewTab", () => {
  /**
   * 目的：仅 `"0"` 为当前标签；脏数据默认新标签，与产品默认一致。
   */
  it("should_default_to_new_tab_unless_storage_is_zero", () => {
    expect(parseStoredOpenLinksInNewTab(null)).toBe(true);
    expect(parseStoredOpenLinksInNewTab("")).toBe(true);
    expect(parseStoredOpenLinksInNewTab("1")).toBe(true);
    expect(parseStoredOpenLinksInNewTab("garbage")).toBe(true);
    expect(parseStoredOpenLinksInNewTab("0")).toBe(false);
  });
});

describe("parseStoredSearchEngineId", () => {
  /**
   * 目的：自定义搜索引擎 id（如 custom-*）应被保留，避免用户选择后被强制回退到内置引擎。
   * 预期：仅空值回退 baidu；非空字符串保持原值（trim 后）。
   */
  it("should_preserve_custom_engine_id_when_storage_contains_non_empty_value", () => {
    expect(parseStoredSearchEngineId("custom-123")).toBe("custom-123");
    expect(parseStoredSearchEngineId("  custom-searxng  ")).toBe("custom-searxng");
    expect(parseStoredSearchEngineId("google")).toBe("google");
    expect(parseStoredSearchEngineId("")).toBe("baidu");
    expect(parseStoredSearchEngineId(null)).toBe("baidu");
  });
});

describe("parseStoredSidebarLayout", () => {
  /**
   * 目的：侧边栏布局偏好需稳定解析，非法值回退为默认常驻。
   */
  it("should_fallback_to_always_visible_when_sidebar_layout_storage_is_invalid", () => {
    expect(parseStoredSidebarLayout("auto-hide")).toBe("auto-hide");
    expect(parseStoredSidebarLayout("always-visible")).toBe("always-visible");
    expect(parseStoredSidebarLayout("")).toBe("always-visible");
    expect(parseStoredSidebarLayout("invalid")).toBe("always-visible");
    expect(parseStoredSidebarLayout(null)).toBe("always-visible");
  });
});

describe("parseStoredGridItemNamesVisible", () => {
  /**
   * 目的：网格名称显示偏好应对脏值有稳定回退；仅 `"0"` 表示隐藏。
   */
  it("should_default_to_visible_unless_storage_is_zero", () => {
    expect(parseStoredGridItemNamesVisible(null)).toBe(true);
    expect(parseStoredGridItemNamesVisible("")).toBe(true);
    expect(parseStoredGridItemNamesVisible("1")).toBe(true);
    expect(parseStoredGridItemNamesVisible("garbage")).toBe(true);
    expect(parseStoredGridItemNamesVisible("0")).toBe(false);
  });
});

describe("useUiPreferences storage contract", () => {
  afterEach(() => {
    globalThis.localStorage?.removeItem(UI_LAYOUT_STORAGE_KEY);
    globalThis.localStorage?.removeItem(UI_OPEN_LINKS_IN_NEW_TAB_STORAGE_KEY);
    globalThis.localStorage?.removeItem(UI_COLOR_SCHEME_STORAGE_KEY);
    globalThis.localStorage?.removeItem(UI_SEARCH_ENGINE_STORAGE_KEY);
    globalThis.localStorage?.removeItem(UI_SIDEBAR_LAYOUT_STORAGE_KEY);
    globalThis.localStorage?.removeItem(UI_GRID_ITEM_NAMES_VISIBLE_STORAGE_KEY);
  });

  /**
   * 目的：键名稳定，避免与其它偏好冲突。
   */
  it("should_use_documented_storage_keys", () => {
    expect(UI_LAYOUT_STORAGE_KEY).toBe("xallor_ui_layout");
    expect(UI_OPEN_LINKS_IN_NEW_TAB_STORAGE_KEY).toBe("xallor_ui_open_links_in_new_tab");
    expect(UI_COLOR_SCHEME_STORAGE_KEY).toBe("xallor_ui_color_scheme");
    expect(UI_SEARCH_ENGINE_STORAGE_KEY).toBe("xallor_ui_search_engine");
    expect(UI_SIDEBAR_LAYOUT_STORAGE_KEY).toBe("xallor_ui_sidebar_layout");
    expect(UI_GRID_ITEM_NAMES_VISIBLE_STORAGE_KEY).toBe("xallor_ui_grid_item_names_visible");
  });
});
