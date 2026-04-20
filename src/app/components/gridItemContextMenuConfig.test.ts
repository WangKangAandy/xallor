import { describe, expect, it, vi } from "vitest";
import { getGridItemContextMenuEntries } from "./gridItemContextMenuConfig";

describe("getGridItemContextMenuEntries", () => {
  /**
   * 目的：未提供删除与整理回调时不应挂载菜单项，避免空菜单或误触。
   */
  it("should_return_empty_entries_when_handlers_absent", () => {
    expect(getGridItemContextMenuEntries("a")).toEqual([]);
  });

  /**
   * 目的：提供删除回调时须生成可执行项，且 onSelect 携带正确 id。
   */
  it("should_invoke_delete_with_item_id_when_remove_entry_selected", () => {
    const onDelete = vi.fn();
    const entries = getGridItemContextMenuEntries("tile-1", onDelete);
    expect(entries).toHaveLength(1);
    entries[0].onSelect();
    expect(onDelete).toHaveBeenCalledWith("tile-1");
  });

  /**
   * 目的：A0-4 接线后，右键菜单应能同时提供“删除图标”与“整理模式”入口。
   */
  it("should_include_remove_and_arrange_entries_when_both_handlers_provided", () => {
    const onDelete = vi.fn();
    const onArrange = vi.fn();
    const entries = getGridItemContextMenuEntries("item-1", onDelete, onArrange);
    expect(entries.map((e) => e.id)).toEqual(["remove", "arrange-mode"]);
    entries[0]?.onSelect();
    entries[1]?.onSelect();
    expect(onDelete).toHaveBeenCalledWith("item-1");
    expect(onArrange).toHaveBeenCalledTimes(1);
  });

  /**
   * 目的：下载壁纸仅属于空白区菜单，图标菜单中不应出现 download-wallpaper。
   */
  it("should_not_include_download_wallpaper_entry_in_item_context_menu", () => {
    const entries = getGridItemContextMenuEntries("site-1", vi.fn(), vi.fn(), vi.fn());
    expect(entries.some((entry) => entry.id === "download-wallpaper")).toBe(false);
  });

  /**
   * 目的：提供隐藏回调时应出现“隐藏”入口并携带当前 itemId。
   */
  it("should_invoke_hide_with_item_id_when_hide_entry_selected", () => {
    const onHide = vi.fn();
    const entries = getGridItemContextMenuEntries("item-hide-1", undefined, undefined, onHide);
    expect(entries.map((e) => e.id)).toEqual(["hide"]);
    entries[0]?.onSelect();
    expect(onHide).toHaveBeenCalledWith("item-hide-1");
  });

  /**
   * 目的：仅当注入临时打开回调时，菜单应出现“当前窗口打开 / 新窗口打开”两项。
   */
  it("should_include_temporary_open_entries_when_open_handlers_provided", () => {
    const onOpenCurrent = vi.fn();
    const onOpenNew = vi.fn();
    const entries = getGridItemContextMenuEntries("site-1", undefined, undefined, undefined, onOpenCurrent, onOpenNew);
    expect(entries.slice(0, 2).map((e) => e.id)).toEqual(["open-current-window", "open-new-window"]);
    entries[0]?.onSelect();
    entries[1]?.onSelect();
    expect(onOpenCurrent).toHaveBeenCalledTimes(1);
    expect(onOpenNew).toHaveBeenCalledTimes(1);
  });
});
