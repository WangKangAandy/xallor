import { describe, expect, it } from "vitest";
import { canWheelNextPage, multiPageGridReducer } from "./useMultiPageGridPersistence";

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
});
