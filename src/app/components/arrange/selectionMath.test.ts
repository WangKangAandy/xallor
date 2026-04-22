import { describe, expect, it } from "vitest";
import { buildSelectionRect, intersectsRect } from "./selectionMath";

describe("selectionMath", () => {
  /**
   * 目的：框选支持任意方向拖拽（左上到右下或反向），矩形应始终归一化。
   */
  it("should_normalize_selection_rect_when_drag_direction_is_reversed", () => {
    const rect = buildSelectionRect({ x: 200, y: 160 }, { x: 120, y: 100 });
    expect(rect).toEqual({ left: 120, top: 100, right: 200, bottom: 160 });
  });

  /**
   * 目的：只要图标包围盒与框选矩形相交即命中。
   */
  it("should_return_true_when_rectangles_intersect", () => {
    const selection = { left: 100, top: 100, right: 180, bottom: 180 };
    const card = { left: 170, top: 170, right: 220, bottom: 220 };
    expect(intersectsRect(selection, card)).toBe(true);
  });

  /**
   * 目的：纯空白框选（无相交）不应触发命中。
   */
  it("should_return_false_when_rectangles_do_not_intersect", () => {
    const selection = { left: 100, top: 100, right: 180, bottom: 180 };
    const card = { left: 181, top: 181, right: 220, bottom: 220 };
    expect(intersectsRect(selection, card)).toBe(false);
  });
});

