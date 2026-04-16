import { describe, expect, it } from "vitest";
import type { GridDnDDragItem } from "../desktopGridDnDTypes";
import type { GridItemType } from "../desktopGridTypes";
import {
  deleteItemsByArrangeSelection,
  getSelectableArrangeIdsFromGridItem,
  moveDraggedItemByDrop,
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
      colorFrom: "rgba(0,0,0,0.1)",
      colorTo: "rgba(0,0,0,0.2)",
      sites: [
        { name: "A", domain: "a.com", url: "https://a.com" },
        { name: "B", domain: "b.com", url: "https://b.com" },
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
        site: { name: "site", domain: "site.com", url: "https://site.com" },
      },
      {
        id: "folder-1",
        type: "folder",
        shape: { cols: 2, rows: 1 },
        name: "folder",
        colorFrom: "rgba(0,0,0,0.1)",
        colorTo: "rgba(0,0,0,0.2)",
        sites: [
          { name: "A", domain: "a.com", url: "https://a.com" },
          { name: "B", domain: "b.com", url: "https://b.com" },
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

describe("moveDraggedItemByDrop", () => {
  /**
   * 目的：从文件夹拖出的站点在中心落到 folder 时，应从源文件夹移除并追加到目标文件夹。
   */
  it("should_move_folder_site_to_target_folder_when_center_drop", () => {
    const items: GridItemType[] = [
      {
        id: "folder-src",
        type: "folder",
        shape: { cols: 2, rows: 1 },
        name: "src",
        colorFrom: "rgba(0,0,0,0.1)",
        colorTo: "rgba(0,0,0,0.2)",
        sites: [
          { name: "A", domain: "a.com", url: "https://a.com" },
          { name: "B", domain: "b.com", url: "https://b.com" },
        ],
      },
      {
        id: "folder-dst",
        type: "folder",
        shape: { cols: 2, rows: 1 },
        name: "dst",
        colorFrom: "rgba(0,0,0,0.1)",
        colorTo: "rgba(0,0,0,0.2)",
        sites: [{ name: "C", domain: "c.com", url: "https://c.com" }],
      },
    ];
    const dragged: GridDnDDragItem = {
      id: "folder-site-1",
      type: "folder-site",
      sourceFolderId: "folder-src",
      site: { name: "A", domain: "a.com", url: "https://a.com" },
    };

    const result = moveDraggedItemByDrop(items, dragged, "folder-dst", { inCenterZone: true, shouldMerge: true });
    const src = result.find((item) => item.id === "site-from-folder-src");
    const dst = result.find((item) => item.id === "folder-dst");
    expect(src?.type).toBe("site");
    if (src?.type === "site") {
      expect(src.site.url).toBe("https://b.com");
    }
    expect(dst?.type).toBe("folder");
    if (dst?.type === "folder") {
      expect(dst.sites.map((site) => site.url)).toContain("https://a.com");
      expect(dst.sites).toHaveLength(2);
    }
  });

  /**
   * 目的：主网格 site 合并到 site 时，命令层应统一创建新文件夹并移除拖拽源。
   */
  it("should_merge_site_into_site_and_create_folder_when_merge_enabled", () => {
    const items: GridItemType[] = [
      {
        id: "site-a",
        type: "site",
        shape: { cols: 1, rows: 1 },
        site: { name: "A", domain: "a.com", url: "https://a.com" },
      },
      {
        id: "site-b",
        type: "site",
        shape: { cols: 1, rows: 1 },
        site: { name: "B", domain: "b.com", url: "https://b.com" },
      },
    ];
    const dragged: GridDnDDragItem = { id: "site-a", type: "site" };

    const result = moveDraggedItemByDrop(items, dragged, "site-b", {
      shouldMerge: true,
      createIdSeed: () => 42,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("folder");
    if (result[0]?.type === "folder") {
      expect(result[0].id).toBe("folder-42");
      expect(result[0].sites.map((site) => site.url).sort()).toEqual(["https://a.com", "https://b.com"]);
    }
  });
});
