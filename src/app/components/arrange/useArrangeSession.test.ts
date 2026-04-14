import { describe, expect, it } from "vitest";
import { ARRANGE_SESSION_INITIAL_STATE } from "./arrangeTypes";
import { arrangeSessionReducer } from "./useArrangeSession";

describe("arrangeSessionReducer", () => {
  /**
   * 目的：进入整理模式时应初始化会话态，避免沿用上一次残留选择或拖拽状态。
   */
  it("should_reset_session_and_enter_browse_stage_when_enter_arrange_mode", () => {
    const dirty = {
      ...ARRANGE_SESSION_INITIAL_STATE,
      isArrangeMode: true,
      stage: "dragging-batch" as const,
      selectedIds: new Set(["a", "b"]),
      draggingIds: ["a"],
      trashZoneActive: true,
      activePageId: "old",
    };
    const next = arrangeSessionReducer(dirty, { type: "enter", activePageId: "p-1" });
    expect(next.isArrangeMode).toBe(true);
    expect(next.stage).toBe("browse");
    expect(Array.from(next.selectedIds)).toEqual([]);
    expect(next.draggingIds).toEqual([]);
    expect(next.trashZoneActive).toBe(false);
    expect(next.activePageId).toBe("p-1");
  });

  /**
   * 目的：整理模式下点击同一项可在选中/取消之间切换，支持后续多选批量操作。
   */
  it("should_toggle_selection_when_in_arrange_mode", () => {
    const entered = arrangeSessionReducer(ARRANGE_SESSION_INITIAL_STATE, { type: "enter", activePageId: "p-1" });
    const once = arrangeSessionReducer(entered, { type: "toggleSelect", id: "item:1" });
    const twice = arrangeSessionReducer(once, { type: "toggleSelect", id: "item:1" });
    expect(Array.from(once.selectedIds)).toEqual(["item:1"]);
    expect(Array.from(twice.selectedIds)).toEqual([]);
  });

  /**
   * 目的：文件夹外层勾选联动需要批量设置选择态，确保可一次性全选/全不选。
   */
  it("should_set_many_selected_ids_when_batch_selection_action_dispatched", () => {
    const entered = arrangeSessionReducer(ARRANGE_SESSION_INITIAL_STATE, { type: "enter", activePageId: "p-1" });
    const selected = arrangeSessionReducer(entered, {
      type: "setManySelected",
      ids: ["a", "b"],
      selected: true,
    });
    const unselected = arrangeSessionReducer(selected, {
      type: "setManySelected",
      ids: ["a"],
      selected: false,
    });
    expect(Array.from(selected.selectedIds).sort()).toEqual(["a", "b"]);
    expect(Array.from(unselected.selectedIds)).toEqual(["b"]);
  });

  /**
   * 目的：退出整理模式应恢复初始状态，确保下次进入是干净会话。
   */
  it("should_return_initial_state_when_exit_arrange_mode", () => {
    const entered = arrangeSessionReducer(ARRANGE_SESSION_INITIAL_STATE, { type: "enter", activePageId: "p-1" });
    const selected = arrangeSessionReducer(entered, { type: "toggleSelect", id: "item:1" });
    const exited = arrangeSessionReducer(selected, { type: "exit" });
    expect(exited).toEqual(ARRANGE_SESSION_INITIAL_STATE);
  });
});

