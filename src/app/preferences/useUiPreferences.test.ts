/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import { parseStoredLayoutMode, UI_LAYOUT_STORAGE_KEY } from "./useUiPreferences";

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

describe("useUiPreferences storage contract", () => {
  afterEach(() => {
    globalThis.localStorage?.removeItem(UI_LAYOUT_STORAGE_KEY);
  });

  /**
   * 目的：键名稳定，避免与 locale 等其它偏好冲突。
   */
  it("should_use_documented_storage_key", () => {
    expect(UI_LAYOUT_STORAGE_KEY).toBe("xallor_ui_layout");
  });
});
