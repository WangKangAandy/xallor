/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { parseStoredColorScheme, UI_COLOR_SCHEME_STORAGE_KEY } from "./colorSchemeStorage";

describe("parseStoredColorScheme", () => {
  /**
   * 目的：与首屏 inline 脚本一致；脏数据回退 system，避免非法值进入 runtime。
   */
  it("should_fallback_to_system_when_storage_missing_or_invalid", () => {
    expect(parseStoredColorScheme(null)).toBe("system");
    expect(parseStoredColorScheme("")).toBe("system");
    expect(parseStoredColorScheme("garbage")).toBe("system");
    expect(parseStoredColorScheme("light")).toBe("light");
    expect(parseStoredColorScheme("dark")).toBe("dark");
    expect(parseStoredColorScheme("system")).toBe("system");
  });

  it("should_use_documented_storage_key_constant", () => {
    expect(UI_COLOR_SCHEME_STORAGE_KEY).toBe("xallor_ui_color_scheme");
  });
});
