import { describe, expect, it } from "vitest";
import { ADD_ICON_CATALOG, filterAddIconCatalog } from "./addIconCatalog";

describe("filterAddIconCatalog", () => {
  /**
   * 目的：筛选与搜索组合须稳定，避免左栏列表与选中态脱节。
   */
  it("should_return_only_sites_when_filter_is_sites", () => {
    const r = filterAddIconCatalog(ADD_ICON_CATALOG, "sites", "");
    expect(r.every((e) => e.kind === "site")).toBe(true);
    expect(r.length).toBeGreaterThan(0);
  });

  it("should_match_search_on_domain_or_name", () => {
    const r = filterAddIconCatalog(ADD_ICON_CATALOG, "all", "git");
    expect(r.some((e) => e.kind === "site" && e.name === "GitHub")).toBe(true);
  });

  /**
   * 目的：组件目录项使用 i18n key，搜索须同时命中中英文关键字（不依赖当前界面语言）。
   */
  it("should_match_component_search_in_zh_or_en_haystack", () => {
    const zh = filterAddIconCatalog(ADD_ICON_CATALOG, "components", "天气");
    expect(zh.some((e) => e.kind === "component" && e.id === "cat-widget-weather")).toBe(true);

    const en = filterAddIconCatalog(ADD_ICON_CATALOG, "components", "weather");
    expect(en.some((e) => e.kind === "component" && e.id === "cat-widget-weather")).toBe(true);
  });
});
