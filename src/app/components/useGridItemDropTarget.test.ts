import { describe, expect, it } from "vitest";
import { shouldTriggerEdgeReorder } from "./useGridItemDropTarget";

describe("shouldTriggerEdgeReorder", () => {
  /**
   * 目的：边缘区命中时即应触发重排，避免必须“先入中心再离开”导致偶发失效。
   */
  it("should_trigger_when_hovering_edge_with_normal_item", () => {
    expect(
      shouldTriggerEdgeReorder({
        inCenterZone: false,
        draggedType: "site",
        draggedIndex: 2,
        hoverIndex: 1,
      }),
    ).toBe(true);
  });

  /**
   * 目的：中心区用于合并意图，不应触发边缘重排。
   */
  it("should_not_trigger_when_in_center_zone", () => {
    expect(
      shouldTriggerEdgeReorder({
        inCenterZone: true,
        draggedType: "site",
        draggedIndex: 2,
        hoverIndex: 1,
      }),
    ).toBe(false);
  });
});

