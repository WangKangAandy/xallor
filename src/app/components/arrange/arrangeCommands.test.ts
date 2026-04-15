import { describe, expect, it } from "vitest";
import type { GridItemType } from "../desktopGridTypes";
import {
  deleteItemsByArrangeSelection,
  getSelectableArrangeIdsFromGridItem,
  shouldSelectAllIds,
} from "./arrangeCommands";

describe("getSelectableArrangeIdsFromGridItem", () => {
  /**
   * 目的：文件夹选择应映射到其内部站点复合 id，而非文件夹壳 id。
   */
  it("should_map_folder_to_composite_site_ids_when_item_is_folder", () => {
    const folder: GridItemType = {
      id: "folder-1",
      type: "folder",
      shape: { cols: 2, rows: 1 },
      name: "folder",
      sites: [
        { name: "A", url: "https://a.com" },
        { name: "B", url: "https://b.com" },
      ],
    };
    const ids = getSelectableArrangeIdsFromGridItem(folder);
    expect(ids).toHaveLength(2);
    expect(ids[0]).toContain("folder:folder-1:site:");
  });
});

describe("shouldSelectAllIds", () => {
  /**
   * 目的：folder 圆点切换应在“全选/全取消”之间稳定切换。
   */
  it("should_return_false_when_all_ids_already_selected", () => {
    const selected = new Set(["a", "b"]);
    expect(shouldSelectAllIds(["a", "b"], selected)).toBe(false);
  });
});

describe("deleteItemsByArrangeSelection", () => {
  /**
   * 目的：删除选择集时应同时支持桌面项与文件夹内部站点，并保持文件夹规范化。
   */
  it("should_delete_site_item_and_folder_inner_site_when_selection_contains_mixed_ids", () => {
    const items: GridItemType[] = [
      {
        id: "site-1",
        type: "site",
        shape: { cols: 1, rows: 1 },
        site: { name: "site", url: "https://site.com" },
      },
      {
        id: "folder-1",
        type: "folder",
        shape: { cols: 2, rows: 1 },
        name: "folder",
        sites: [
          { name: "A", url: "https://a.com" },
          { name: "B", url: "https://b.com" },
        ],
      },
    ];
    const selected = new Set(["site-1", "folder:folder-1:site:https%3A%2F%2Fa.com"]);
    const result = deleteItemsByArrangeSelection(items, selected);
    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("site");
    if (result[0]?.type === "site") {
      expect(result[0].site.url).toBe("https://b.com");
    }
  });
});
