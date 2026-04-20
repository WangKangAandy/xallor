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

  /**
   * 目的：新增下载功能后，空白菜单应包含“下载壁纸”且不影响整理模式入口顺序。
   */
  it("should_include_download_and_arrange_entries_when_both_handlers_provided", () => {
    const onArrange = vi.fn();
    const onDownload = vi.fn();
    const entries = getGridBackgroundContextMenuEntries(onArrange, onDownload, false);
    expect(entries.map((e) => e.id)).toEqual(["download-wallpaper", "arrange-mode"]);
    entries[0]?.onSelect();
    entries[1]?.onSelect();
    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(onArrange).toHaveBeenCalledTimes(1);
  });

  /**
   * 目的：下载进行中应禁用重复触发，防止连续多次请求。
   */
  it("should_not_trigger_download_when_download_is_in_progress", () => {
    const onDownload = vi.fn();
    const entries = getGridBackgroundContextMenuEntries(undefined, onDownload, true);
    expect(entries.map((e) => e.label)).toEqual(["下载中..."]);
    entries[0]?.onSelect();
    expect(onDownload).not.toHaveBeenCalled();
  });
});

