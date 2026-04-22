import { describe, expect, it } from "vitest";
import type { FolderItem, SiteItem } from "./desktopGridTypes";
import { normalizeFolderAsGridItems, removeGridItemById, removeSiteFromFolderByUrl } from "./desktopGridItemActions";

const site = (id: string): SiteItem => ({
  id,
  type: "site",
  shape: { cols: 1, rows: 1 },
  site: { name: "x", domain: "x.com", url: "https://x.com" },
});

const folder = (id: string, urls: string[]): FolderItem => ({
  id,
  type: "folder",
  shape: { cols: 2, rows: 1 },
  name: "f",
  colorFrom: "a",
  colorTo: "b",
  sites: urls.map((url, idx) => ({ name: `n${idx}`, domain: "x.com", url })),
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

/**
 * 目的：保证文件夹语义严格成立，只有 2+ 图标时才保留 folder。
 */
describe("normalizeFolderAsGridItems", () => {
  it("should_keep_folder_when_folder_has_two_or_more_sites", () => {
    const normalized = normalizeFolderAsGridItems(folder("f1", ["https://a.com", "https://b.com"]));
    expect(normalized).toHaveLength(1);
    expect(normalized[0]?.type).toBe("folder");
  });

  it("should_degrade_to_site_when_folder_has_single_site", () => {
    const normalized = normalizeFolderAsGridItems(folder("f2", ["https://a.com"]));
    expect(normalized).toHaveLength(1);
    expect(normalized[0]?.type).toBe("site");
  });

  it("should_remove_folder_when_folder_has_no_sites", () => {
    const normalized = normalizeFolderAsGridItems(folder("f3", []));
    expect(normalized).toEqual([]);
  });
});

/**
 * 目的：从文件夹删除内部图标后应自动收敛，不留下单图标文件夹。
 */
describe("removeSiteFromFolderByUrl", () => {
  it("should_degrade_folder_to_site_when_only_one_site_left_after_removal", () => {
    const items = [folder("f1", ["https://a.com", "https://b.com"])];
    const next = removeSiteFromFolderByUrl(items, "f1", "https://a.com");
    expect(next).toHaveLength(1);
    expect(next[0]?.type).toBe("site");
  });
});
