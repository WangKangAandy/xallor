/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  parseStoredLayoutMode,
  parseStoredOpenLinksInNewTab,
  UI_COLOR_SCHEME_STORAGE_KEY,
  UI_LAYOUT_STORAGE_KEY,
  UI_OPEN_LINKS_IN_NEW_TAB_STORAGE_KEY,
  UI_SEARCH_ENGINE_STORAGE_KEY,
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

describe("useUiPreferences storage contract", () => {
  afterEach(() => {
    globalThis.localStorage?.removeItem(UI_LAYOUT_STORAGE_KEY);
    globalThis.localStorage?.removeItem(UI_OPEN_LINKS_IN_NEW_TAB_STORAGE_KEY);
    globalThis.localStorage?.removeItem(UI_COLOR_SCHEME_STORAGE_KEY);
    globalThis.localStorage?.removeItem(UI_SEARCH_ENGINE_STORAGE_KEY);
  });

  /**
   * 目的：键名稳定，避免与其它偏好冲突。
   */
  it("should_use_documented_storage_keys", () => {
    expect(UI_LAYOUT_STORAGE_KEY).toBe("xallor_ui_layout");
    expect(UI_OPEN_LINKS_IN_NEW_TAB_STORAGE_KEY).toBe("xallor_ui_open_links_in_new_tab");
    expect(UI_COLOR_SCHEME_STORAGE_KEY).toBe("xallor_ui_color_scheme");
    expect(UI_SEARCH_ENGINE_STORAGE_KEY).toBe("xallor_ui_search_engine");
  });
});
