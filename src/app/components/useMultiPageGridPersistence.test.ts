import { describe, expect, it } from "vitest";
import { MAX_DESKTOP_PAGES } from "../storage/multiPageLimits";
import { buildPageWidgetLayoutIndex, canWheelNextPage, multiPageGridReducer } from "./useMultiPageGridPersistence";

const siteItem = {
  id: "s1",
  type: "site" as const,
  shape: { cols: 1, rows: 1 },
  site: { name: "Example", domain: "example.com", url: "https://example.com" },
};

/**
 * 当末页为空时，滚轮「下一页」不应再追加新桌面，避免无限叠空页。
 */
describe("canWheelNextPage", () => {
  it("should_be_false_when_only_page_is_empty", () => {
    expect(canWheelNextPage([{ items: [], showLabels: true, pageId: "a" }], 0)).toBe(false);
  });

  it("should_be_true_when_only_page_has_items", () => {
    expect(
      canWheelNextPage(
        [{ items: [siteItem], showLabels: true, pageId: "p1" }],
        0,
      ),
    ).toBe(true);
  });

  it("should_be_false_when_at_max_pages_on_last_with_items", () => {
    const pages = Array.from({ length: MAX_DESKTOP_PAGES }, (_, i) => ({
      items: [siteItem],
      showLabels: true,
      pageId: `p${i}`,
    }));
    expect(canWheelNextPage(pages, MAX_DESKTOP_PAGES - 1)).toBe(false);
  });

  it("should_allow_next_slide_when_max_pages_but_not_on_last", () => {
    const pages = Array.from({ length: MAX_DESKTOP_PAGES }, (_, i) => ({
      items: [siteItem],
      showLabels: true,
      pageId: `p${i}`,
    }));
    expect(canWheelNextPage(pages, MAX_DESKTOP_PAGES - 2)).toBe(true);
  });
});

/**
 * 目的：按 pageId 更新网格项，重排页序后仍指向同一页；未知 id 不改变状态。
 */
describe("multiPageGridReducer updateItems", () => {
  it("should_update_items_for_matching_pageId", () => {
    const state = {
      pages: [
        { items: [siteItem], showLabels: true, pageId: "p-a" },
        { items: [], showLabels: false, pageId: "p-b" },
      ],
      activePageIndex: 0,
      isHydrated: true,
    };
    const next = multiPageGridReducer(state, {
      type: "updateItems",
      pageId: "p-b",
      updater: [siteItem],
    });
    expect(next.pages[0].items).toHaveLength(1);
    expect(next.pages[1].items).toHaveLength(1);
    expect(next.pages[1].pageId).toBe("p-b");
  });

  it("should_noop_when_pageId_not_found", () => {
    const state = {
      pages: [{ items: [], showLabels: true, pageId: "only" }],
      activePageIndex: 0,
      isHydrated: true,
    };
    const next = multiPageGridReducer(state, {
      type: "updateItems",
      pageId: "missing",
      updater: [siteItem],
    });
    expect(next).toBe(state);
  });

  /**
   * 目的：单路径模式下，widgetLayout 仅为元数据；更新 items 后应同步 widgets 镜像并清理残留 layout。
   */
  it("should_sync_widget_layout_metadata_with_items_when_updating_page_items", () => {
    const state = {
      pages: [
        {
          items: [siteItem],
          showLabels: true,
          pageId: "p-a",
          widgetLayout: {
            widgets: ["ghost", "s1"],
            layout: [
              { id: "ghost", x: 0, y: 0, w: 1, h: 1, mode: "floating" as const, resizable: false },
              { id: "s1", x: 1, y: 0, w: 1, h: 1, mode: "floating" as const, resizable: false },
            ],
            compactionStrategy: "compact" as const,
            conflictStrategy: "eject" as const,
          },
        },
      ],
      activePageIndex: 0,
      isHydrated: true,
    };
    const nextItem = {
      id: "s2",
      type: "site" as const,
      shape: { cols: 1, rows: 1 },
      site: { name: "Second", domain: "second.com", url: "https://second.com" },
    };
    const next = multiPageGridReducer(state, {
      type: "updateItems",
      pageId: "p-a",
      updater: [nextItem],
    });
    expect(next.pages[0].widgetLayout?.widgets).toEqual(["s2"]);
    expect(next.pages[0].widgetLayout?.layout).toEqual([]);
    expect(next.pages[0].widgetLayout?.compactionStrategy).toBe("compact");
    expect(next.pages[0].widgetLayout?.conflictStrategy).toBe("eject");
  });
});

describe("multiPageGridReducer setPageCompactionStrategy", () => {
  /**
   * 目的：设置开关写入当前页 widgetLayout，支持自动补位策略按页持久化控制。
   */
  it("should_update_auto_compact_flag_for_target_page", () => {
    const state = {
      pages: [
        { items: [], showLabels: true, pageId: "p-a" },
        {
          items: [],
          showLabels: true,
          pageId: "p-b",
          widgetLayout: { widgets: [], layout: [], autoCompactEnabled: true },
        },
      ],
      activePageIndex: 0,
      isHydrated: true,
    };
    const next = multiPageGridReducer(state, {
      type: "setPageCompactionStrategy",
      pageId: "p-b",
      strategy: "no-compact",
    });
    expect(next.pages[1].widgetLayout?.autoCompactEnabled).toBe(false);
    expect(next.pages[1].widgetLayout?.compactionStrategy).toBe("no-compact");
  });
});

describe("multiPageGridReducer setPageConflictStrategy", () => {
  /**
   * 目的：按页切换冲突策略后，widgetLayout 应写入对应枚举值供 DnD 行为消费。
   */
  it("should_update_conflict_strategy_for_target_page", () => {
    const state = {
      pages: [
        { items: [], showLabels: true, pageId: "p-a" },
        {
          items: [],
          showLabels: true,
          pageId: "p-b",
          widgetLayout: { widgets: [], layout: [], conflictStrategy: "eject" as const },
        },
      ],
      activePageIndex: 0,
      isHydrated: true,
    };
    const next = multiPageGridReducer(state, {
      type: "setPageConflictStrategy",
      pageId: "p-b",
      strategy: "swap",
    });
    expect(next.pages[1].widgetLayout?.conflictStrategy).toBe("swap");
  });
});

describe("multiPageGridReducer setPageWidgetLayout", () => {
  /**
   * 目的：RGL 灰度下拖拽回写布局后，按 pageId 写入 widgetLayout，供持久化与刷新恢复。
   */
  it("should_replace_widget_layout_for_target_page", () => {
    const state = {
      pages: [{ items: [], showLabels: true, pageId: "p-a" }],
      activePageIndex: 0,
      isHydrated: true,
    };
    const next = multiPageGridReducer(state, {
      type: "setPageWidgetLayout",
      pageId: "p-a",
      layout: {
        widgets: ["x"],
        layout: [{ id: "x", x: 1, y: 2, w: 1, h: 1, mode: "floating", resizable: true }],
        compactionStrategy: "compact",
        conflictStrategy: "eject",
      },
    });
    expect(next.pages[0].widgetLayout?.layout[0]).toMatchObject({ id: "x", x: 1, y: 2 });
  });
});

describe("multiPageGridReducer wheelNext", () => {
  it("should_not_append_page_when_current_last_page_has_no_items", () => {
    const state = {
      pages: [
        { items: [siteItem], showLabels: true, pageId: "a" },
        { items: [], showLabels: true, pageId: "b" },
      ],
      activePageIndex: 1,
      isHydrated: true,
    };
    const next = multiPageGridReducer(state, { type: "wheelNext" });
    expect(next.pages.length).toBe(2);
    expect(next.activePageIndex).toBe(1);
  });

  it("should_append_empty_page_when_on_last_page_with_items", () => {
    const state = {
      pages: [{ items: [siteItem], showLabels: true, pageId: "only" }],
      activePageIndex: 0,
      isHydrated: true,
    };
    const next = multiPageGridReducer(state, { type: "wheelNext" });
    expect(next.pages.length).toBe(2);
    expect(next.activePageIndex).toBe(1);
    expect(next.pages[1].items.length).toBe(0);
    expect(typeof next.pages[1].pageId).toBe("string");
    expect(next.pages[1].pageId.length).toBeGreaterThan(0);
  });

  it("should_not_append_when_already_at_max_pages", () => {
    const pages = Array.from({ length: MAX_DESKTOP_PAGES }, (_, i) => ({
      items: [siteItem],
      showLabels: true,
      pageId: `p${i}`,
    }));
    const state = {
      pages,
      activePageIndex: MAX_DESKTOP_PAGES - 1,
      isHydrated: true,
    };
    const next = multiPageGridReducer(state, { type: "wheelNext" });
    expect(next.pages.length).toBe(MAX_DESKTOP_PAGES);
    expect(next.activePageIndex).toBe(MAX_DESKTOP_PAGES - 1);
  });
});

describe("buildPageWidgetLayoutIndex", () => {
  /**
   * 目的：阶段 B 并存期间，上层可按 pageId 读取 layout-ready 元信息，不影响原 `pages[].items` 渲染链路。
   */
  it("should_index_widget_layout_by_page_id_when_present", () => {
    const pages = [
      {
        pageId: "p1",
        items: [siteItem],
        showLabels: true,
        widgetLayout: {
          widgets: ["s1"],
          layout: [{ id: "s1", x: 0, y: 0, w: 1, h: 1, mode: "floating" as const, resizable: false }],
        },
      },
      { pageId: "p2", items: [], showLabels: true },
    ];
    const out = buildPageWidgetLayoutIndex(pages);
    expect(out.p1?.widgets).toEqual(["s1"]);
    expect(out.p2).toBeUndefined();
  });
});
