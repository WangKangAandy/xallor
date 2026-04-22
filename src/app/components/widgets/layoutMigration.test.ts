import { describe, expect, it } from "vitest";
import type { GridItemType } from "../desktopGridTypes";
import { migrateLegacyItemsToWidgetLayout } from "./layoutMigration";
import { isValidWidgetLayout } from "./layoutSchema";

describe("layoutMigration", () => {
  /**
   * 目的：legacy items 迁移后须生成与 id 对齐的 x/y/w/h，供后续 RGL / 约束引擎复用。
   */
  it("should_generate_layout_records_with_same_ids_and_valid_shape", () => {
    const items: GridItemType[] = [
      {
        id: "s1",
        type: "site",
        shape: { cols: 1, rows: 1 },
        site: { name: "GitHub", domain: "github.com", url: "https://github.com" },
      },
      {
        id: "w1",
        type: "widget",
        widgetType: "weather",
        shape: { cols: 2, rows: 2 },
      },
    ];

    const out = migrateLegacyItemsToWidgetLayout(items, { columnCount: 4 });
    expect(out.widgets).toEqual(["s1", "w1"]);
    expect(out.layout.length).toBe(2);
    expect(out.layout.every((l) => isValidWidgetLayout(l))).toBe(true);
    expect(out.layout[0].id).toBe("s1");
    expect(out.layout[1].id).toBe("w1");
    expect(out.autoCompactEnabled).toBe(true);
  });

  /**
   * 目的：支持固定项初始标记，便于后续实现 pinned 不自动补位。
   */
  it("should_mark_items_as_pinned_when_id_in_pinned_set", () => {
    const items: GridItemType[] = [
      {
        id: "a",
        type: "site",
        shape: { cols: 1, rows: 1 },
        site: { name: "A", domain: "a.com", url: "https://a.com" },
      },
    ];

    const out = migrateLegacyItemsToWidgetLayout(items, { pinnedIds: new Set(["a"]) });
    expect(out.layout[0].mode).toBe("pinned");
  });
});

