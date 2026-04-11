import { describe, expect, it } from "vitest";
import { computeResizedShape } from "./folderResizeRules";

describe("computeResizedShape", () => {
  /**
   * 目的：连续拖拽时，计算基于固定起点与实时形状，不应在第一次变化后失效。
   */
  it("should_continue_resizing_when_dragging_folder_border_continuously", () => {
    const startShape = { cols: 2, rows: 2 };

    const first = computeResizedShape({
      startShape,
      baseShape: startShape,
      deltaX: 136,
      deltaY: 0,
      dir: "right",
      isFolder: true,
      siteCount: 8,
    });
    expect(first).toEqual({ cols: 3, rows: 2 });

    const second = computeResizedShape({
      startShape,
      baseShape: first,
      deltaX: 272,
      deltaY: 0,
      dir: "right",
      isFolder: true,
      siteCount: 8,
    });
    expect(second).toEqual({ cols: 4, rows: 2 });
  });

  /**
   * 目的：站点数 <= 6 的文件夹不能进入 3x3，避免超过预览容量设计。
   */
  it("should_not_enter_3x3_when_folder_site_count_is_lte_6", () => {
    const next = computeResizedShape({
      startShape: { cols: 2, rows: 2 },
      baseShape: { cols: 2, rows: 2 },
      deltaX: 136,
      deltaY: 136,
      dir: "bottom-right",
      isFolder: true,
      siteCount: 6,
    });

    expect(next).not.toEqual({ cols: 3, rows: 3 });
    expect(next).toEqual({ cols: 3, rows: 2 });
  });

  /**
   * 目的：全局形状边界必须稳定在 1..4，防止极端拖拽值导致越界。
   */
  it("should_keep_shape_within_global_bounds", () => {
    const next = computeResizedShape({
      startShape: { cols: 1, rows: 1 },
      baseShape: { cols: 1, rows: 1 },
      deltaX: -9999,
      deltaY: -9999,
      dir: "top-left",
      isFolder: false,
    });
    expect(next).toEqual({ cols: 4, rows: 4 });
  });
});

