import { describe, expect, it } from "vitest";
import { GRID_CELL_SIZE, GRID_GAP, GRID_STEP, AVAILABLE_GRID_SHAPES } from "./desktopGridConstants";

describe("desktopGridConstants", () => {
  /**
   * 目的：网格步长与单元格、间距定义一致，避免常量拆文件后出现「步长算错」导致布局与 resize 预览错位。
   */
  it("should_match_GRID_STEP_to_cell_size_plus_gap", () => {
    expect(GRID_STEP).toBe(GRID_CELL_SIZE + GRID_GAP);
  });

  /**
   * 目的：保留可选形状列表，供后续 UI 使用；至少包含 1×1 基准形状。
   */
  it("should_include_unit_shape_in_available_shapes", () => {
    expect(AVAILABLE_GRID_SHAPES.some((s) => s.cols === 1 && s.rows === 1)).toBe(true);
  });
});
