import { describe, expect, it } from "vitest";
import type { SiteItem } from "./desktopGridTypes";
import { removeGridItemById } from "./desktopGridItemActions";

const site = (id: string): SiteItem => ({
  id,
  type: "site",
  shape: { cols: 1, rows: 1 },
  site: { name: "x", domain: "x.com", url: "https://x.com" },
});

/**
 * 目的：右键删除等路径依赖「按 id 过滤」；须保持其余项顺序与内容不变。
 */
describe("removeGridItemById", () => {
  it("should_remove_only_matching_id_preserving_order", () => {
    const items = [site("a"), site("b"), site("c")];
    expect(removeGridItemById(items, "b")).toEqual([site("a"), site("c")]);
  });

  it("should_return_same_order_when_id_missing", () => {
    const items = [site("a")];
    expect(removeGridItemById(items, "missing")).toEqual(items);
  });
});
