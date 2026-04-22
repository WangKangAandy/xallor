import { describe, expect, it } from "vitest";
import { matchSettingsSection, normalizeSettingsSearchQuery } from "./settingsSearch";

describe("settingsSearch", () => {
  /**
   * 目的：关键词命中标题时应优先定位对应分区，保证设置搜索可快速跳转。
   * 前置：输入包含“主题”等外观关键词。
   * 预期：返回 `appearance`。
   */
  it("should_match_appearance_when_query_contains_theme_keyword", () => {
    expect(matchSettingsSection("主题")).toBe("appearance");
    expect(matchSettingsSection("theme")).toBe("appearance");
  });

  /**
   * 目的：无匹配时返回空，供 UI 渲染空态提示。
   * 前置：输入不存在的关键词。
   * 预期：返回 `null`。
   */
  it("should_return_null_when_query_has_no_matching_section", () => {
    expect(matchSettingsSection("not-exists-keyword")).toBeNull();
  });

  /**
   * 目的：输入归一化应消除首尾空格与多空格，避免同义输入匹配分叉。
   * 前置：输入带多余空格。
   * 预期：输出压缩后的标准小写字符串。
   */
  it("should_normalize_whitespace_and_case_when_query_is_dirty", () => {
    expect(normalizeSettingsSearchQuery("  THEME   Search ")).toBe("theme search");
  });
});
