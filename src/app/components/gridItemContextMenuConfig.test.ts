import { describe, expect, it, vi } from "vitest";
import { getGridItemContextMenuEntries } from "./gridItemContextMenuConfig";

describe("getGridItemContextMenuEntries", () => {
  /**
   * 目的：未提供删除回调时不应挂载菜单项，避免空菜单或误触。
   */
  it("should_return_empty_entries_when_delete_handler_absent", () => {
    expect(getGridItemContextMenuEntries("a")).toEqual([]);
  });

  /**
   * 目的：提供删除回调时须生成可执行项，且 onSelect 携带正确 id。
   */
  it("should_invoke_delete_with_item_id_when_entry_selected", () => {
    const onDelete = vi.fn();
    const entries = getGridItemContextMenuEntries("tile-1", onDelete);
    expect(entries).toHaveLength(1);
    entries[0].onSelect();
    expect(onDelete).toHaveBeenCalledWith("tile-1");
  });
});
