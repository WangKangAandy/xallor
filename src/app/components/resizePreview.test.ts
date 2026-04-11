import { describe, expect, it } from "vitest";
import { computeResizePreviewSize, shapeToPixels } from "./resizePreview";

describe("computeResizePreviewSize", () => {
  /**
   * 目的：拖拽缩放时，预览尺寸应连续跟随鼠标位移，而不是仅按网格跳变。
   */
  it("should_update_preview_size_continuously_when_dragging_right_edge", () => {
    const size = computeResizePreviewSize({
      startCols: 2,
      startRows: 2,
      deltaX: 40,
      deltaY: 0,
      dir: "right",
      maxCols: 4,
      maxRows: 4,
    });

    const start = shapeToPixels(2, 2);
    expect(size.width).toBe(start.width + 40);
    expect(size.height).toBe(start.height);
  });

  /**
   * 目的：预览尺寸需遵守边界限制，防止超出允许范围。
   */
  it("should_clamp_preview_size_within_allowed_bounds", () => {
    const size = computeResizePreviewSize({
      startCols: 2,
      startRows: 2,
      deltaX: 9999,
      deltaY: 9999,
      dir: "bottom-right",
      maxCols: 3,
      maxRows: 3,
    });

    expect(size).toEqual(shapeToPixels(3, 3));
  });
});

