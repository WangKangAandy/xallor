import { describe, expect, it, vi } from "vitest";
import { getGridBackgroundContextMenuEntries } from "./gridBackgroundContextMenuConfig";

describe("getGridBackgroundContextMenuEntries", () => {
  /**
   * 目的：空白区域右键菜单只暴露整理模式入口，不包含删除图标。
   */
  it("should_return_only_arrange_entry_when_handler_provided", () => {
    const onArrange = vi.fn();
    const entries = getGridBackgroundContextMenuEntries(onArrange);
    expect(entries.map((e) => e.id)).toEqual(["arrange-mode"]);
    expect(entries.map((e) => e.label)).toEqual(["整理模式"]);
    entries[0]?.onSelect();
    expect(onArrange).toHaveBeenCalledTimes(1);
  });

  it("should_return_empty_entries_when_handler_absent", () => {
    expect(getGridBackgroundContextMenuEntries()).toEqual([]);
  });
});

