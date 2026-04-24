import { describe, expect, it } from "vitest";
import type { MinimalDockSiteEntry } from "./minimalDockTypes";
import type { SiteItem } from "../components/desktopGridTypes";
import { MINIMAL_DOCK_MAX_SLOTS } from "./minimalDockConstants";
import { appendSiteItemsToMinimalDockEntries } from "./minimalDockAppend";

describe("appendSiteItemsToMinimalDockEntries", () => {
  /**
   * 目的：追加站点时应返回对应隐藏项 id 列表供 removeHiddenItemsByIds 使用。
   * 前置：Dock 起始仅站点列表（可为空）。
   * 预期：appendedSiteEntryIds 等于传入 SiteItem 的 id。
   */
  it("should_report_appended_hidden_ids_for_successful_dock_writes", () => {
    const items: SiteItem[] = [
      {
        id: "hid-1",
        type: "site",
        shape: { cols: 1, rows: 1 },
        site: { name: "S", domain: "s.com", url: "https://s.com" },
      },
    ];
    const r = appendSiteItemsToMinimalDockEntries([], items);
    expect(r.appendedSiteEntryIds).toEqual(["hid-1"]);
    expect(r.remaining).toEqual([]);
    expect(r.nextEntries.filter((e) => e.kind === "site")).toHaveLength(1);
  });

  /**
   * 目的：槽位已满时不得从隐藏侧误删：剩余项应留在 remaining。
   * 前置：Dock 已有 MAX_SLOTS 个站点。
   * 预期：appendedSiteEntryIds 为空；remaining 含溢出项。
   */
  it("should_leave_overflow_items_in_remaining_when_dock_full", () => {
    const full: MinimalDockSiteEntry[] = Array.from({ length: MINIMAL_DOCK_MAX_SLOTS }, (_, i) => ({
      kind: "site" as const,
      id: `fill-${i}`,
      site: { name: `N${i}`, domain: "x.com", url: "https://x.com" },
    }));
    const items: SiteItem[] = [
      {
        id: "new-1",
        type: "site",
        shape: { cols: 1, rows: 1 },
        site: { name: "N", domain: "n.com", url: "https://n.com" },
      },
    ];
    const r = appendSiteItemsToMinimalDockEntries(full, items);
    expect(r.appendedSiteEntryIds).toEqual([]);
    expect(r.remaining).toEqual(items);
    expect(r.nextEntries).toEqual(full);
  });
});
