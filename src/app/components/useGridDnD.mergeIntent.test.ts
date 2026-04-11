import { describe, expect, it } from "vitest";
import { resolveMergeIntentAfterClear } from "./useGridDnD";

describe("resolveMergeIntentAfterClear", () => {
  /**
   * 目的：hover 离开或计时器清理时，合并意图的清除规则必须稳定；此前误用非 setState 的 setter 会导致 ref/state 不同步。
   */
  it("should_clear_when_id_omitted", () => {
    expect(resolveMergeIntentAfterClear({ targetId: "a", draggedId: "b" }, undefined)).toBeNull();
  });

  it("should_clear_when_id_matches_merge_target", () => {
    expect(resolveMergeIntentAfterClear({ targetId: "a", draggedId: "b" }, "a")).toBeNull();
  });

  it("should_keep_when_id_differs_from_target", () => {
    const prev = { targetId: "a", draggedId: "b" };
    expect(resolveMergeIntentAfterClear(prev, "x")).toBe(prev);
  });
});
