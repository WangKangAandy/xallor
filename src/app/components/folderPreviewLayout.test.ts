import { describe, expect, it } from "vitest";
import {
  computeAdaptiveGap,
  computeDrawerContentShape,
  computeFolderContentLayout,
  computeFolderResizeAnchors,
  getPreviewCountForShape,
  inferGridShapeFromPixelSize,
  shouldActivateResizeAnchor,
} from "./folderPreviewLayout";

describe("folderPreviewLayout", () => {
  /**
   * 目的：抽屉裁切模式下，特殊形状保持稳定预览数量策略。
   */
  it("should_return_stable_preview_count_for_special_shapes", () => {
    expect(getPreviewCountForShape(1, 1)).toBe(4);
    expect(getPreviewCountForShape(4, 1)).toBe(4);
    expect(getPreviewCountForShape(1, 4)).toBe(4);
    expect(getPreviewCountForShape(2, 2)).toBe(4);
  });

  /**
   * 目的：大文件夹间距需要随可视区域自适应，避免固定 gap 导致过挤或过散。
   */
  it("should_compute_adaptive_gap_within_bounds", () => {
    const compact = computeAdaptiveGap({
      viewport: 180,
      slots: 2,
      iconSize: 64,
      minGap: 10,
      maxGap: 24,
    });
    const spacious = computeAdaptiveGap({
      viewport: 320,
      slots: 2,
      iconSize: 64,
      minGap: 10,
      maxGap: 24,
    });
    expect(compact).toBeGreaterThanOrEqual(10);
    expect(spacious).toBeLessThanOrEqual(24);
    expect(spacious).toBeGreaterThanOrEqual(compact);
  });

  /**
   * 目的：宽视口下 2×2 预览画布应大于内层固定 gap 时的尺寸，使图标区更饱满。
   */
  it("should_expand_gaps_in_spacious_viewport_when_computing_folder_layout", () => {
    const tight = computeFolderContentLayout({
      viewportWidth: 200,
      viewportHeight: 200,
      contentPadding: 20,
      cols: 2,
      rows: 2,
      tier: "large",
    });
    const roomy = computeFolderContentLayout({
      viewportWidth: 320,
      viewportHeight: 320,
      contentPadding: 20,
      cols: 2,
      rows: 2,
      tier: "large",
    });
    expect(roomy.horizontalGap).toBeGreaterThanOrEqual(tight.horizontalGap);
    expect(roomy.verticalGap).toBeGreaterThanOrEqual(tight.verticalGap);
  });

  /**
   * 目的：位移未超过阈值时不应开启锚定模式，避免仅按下时切换居中布局（回归：点边框未拖拽图标上移）。
   */
  it("should_not_activate_resize_anchor_when_delta_below_threshold", () => {
    expect(shouldActivateResizeAnchor(0, 0)).toBe(false);
    expect(shouldActivateResizeAnchor(2, 1)).toBe(false);
    expect(shouldActivateResizeAnchor(3, 0)).toBe(true);
    expect(shouldActivateResizeAnchor(0, -4)).toBe(true);
  });

  /**
   * 目的：像素推断用 floor，与 spanToPixels 逆映射一致；避免 ceil 在高度 237 时误判为 3 行。
   */
  it("should_infer_grid_shape_from_pixel_dimensions_using_floor", () => {
    expect(inferGridShapeFromPixelSize(100, 100)).toEqual({ cols: 1, rows: 1 });
    expect(inferGridShapeFromPixelSize(236, 236)).toEqual({ cols: 2, rows: 2 });
    expect(inferGridShapeFromPixelSize(236, 237)).toEqual({ cols: 2, rows: 2 });
  });

  /**
   * 目的：收缩拖拽时内容栅格不小于拖拽起点，保证四格位置固定仅靠裁切遮住（渐进隐藏）。
   */
  it("should_keep_drawer_content_shape_at_least_drag_start_when_shrinking", () => {
    const shape = computeDrawerContentShape({
      committedShape: { cols: 2, rows: 2 },
      dragStartShape: { cols: 2, rows: 2 },
      livePendingShape: { cols: 2, rows: 1 },
      resizePreview: { width: 236, height: 100 },
      siteCount: 4,
    });
    expect(shape.rows).toBe(2);
    expect(shape.cols).toBe(2);
  });

  /**
   * 目的：扩张时像素达到下一整格 span 后才增加行/列；略大于 2×2 高度时仍保持 2 行预览槽位。
   */
  it("should_allow_larger_drawer_grid_than_committed_when_expanding_preview", () => {
    const shape = computeDrawerContentShape({
      committedShape: { cols: 2, rows: 1 },
      dragStartShape: { cols: 2, rows: 1 },
      livePendingShape: { cols: 2, rows: 1 },
      resizePreview: { width: 236, height: 236 },
      siteCount: 4,
    });
    expect(shape.cols).toBe(2);
    expect(shape.rows).toBe(2);
  });

  /**
   * 目的：2×2 略向下拉时 pending 若已步进到 3 行，仍须以像素 floor 约束，不能立刻出现第三行图标。
   */
  it("should_not_show_third_row_until_preview_height_fits_three_row_span", () => {
    const slight = computeDrawerContentShape({
      committedShape: { cols: 2, rows: 2 },
      dragStartShape: { cols: 2, rows: 2 },
      livePendingShape: { cols: 2, rows: 3 },
      resizePreview: { width: 236, height: 300 },
      siteCount: 6,
    });
    expect(slight.rows).toBe(2);

    const full = computeDrawerContentShape({
      committedShape: { cols: 2, rows: 2 },
      dragStartShape: { cols: 2, rows: 2 },
      livePendingShape: { cols: 2, rows: 3 },
      resizePreview: { width: 236, height: 372 },
      siteCount: 6,
    });
    expect(full.rows).toBe(3);
  });

  /**
   * 目的：从下沿向下扩张时须顶对齐，避免预览块贴底导致 1×2 下拉时两行跑到容器底部。
   */
  it("should_use_top_anchor_when_expanding_by_dragging_bottom_edge", () => {
    const a = computeFolderResizeAnchors({
      activeResizeDir: "bottom",
      resizePreview: { width: 236, height: 200 },
      dragStartShape: { cols: 2, rows: 1 },
    });
    expect(a.vertical).toBe("start");
    expect(a.horizontal).toBe("center");
  });

  /**
   * 目的：从下沿向上收缩时底对齐，下面一行相对裁切底边固定。
   */
  it("should_use_bottom_anchor_when_shrinking_by_dragging_bottom_edge", () => {
    const a = computeFolderResizeAnchors({
      activeResizeDir: "bottom",
      resizePreview: { width: 236, height: 100 },
      dragStartShape: { cols: 2, rows: 2 },
    });
    expect(a.vertical).toBe("end");
  });
});
