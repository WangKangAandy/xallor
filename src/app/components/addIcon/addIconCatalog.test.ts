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
});
