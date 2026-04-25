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
   * 目的：GitHub 目录项应默认带 `www`，避免点击卡片后网址展示回归为无 `www`。
   */
  it("should_keep_www_url_for_github_catalog_item", () => {
    const github = ADD_ICON_CATALOG.find((e) => e.kind === "site" && e.id === "cat-site-github");
    expect(github?.kind).toBe("site");
    if (github?.kind === "site") {
      expect(github.url).toBe("https://www.github.com");
    }
  });

  /**
   * 目的：内置站点目录 URL 统一为 `https://www.` 前缀，避免设置面板展示不一致回归。
   */
  it("should_use_www_prefixed_urls_for_all_builtin_site_catalog_items", () => {
    const sites = ADD_ICON_CATALOG.filter((e) => e.kind === "site");
    expect(sites.length).toBeGreaterThan(0);
    expect(sites.every((site) => site.url.startsWith("https://www."))).toBe(true);
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
