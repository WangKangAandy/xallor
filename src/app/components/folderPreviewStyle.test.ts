import { describe, expect, it } from "vitest";
import { buildFolderPreviewItemStyle } from "./folderPreviewStyle";

describe("buildFolderPreviewItemStyle", () => {
  /**
   * 目的：预览图标容器必须保持 1:1，避免文件夹形状切换时出现瞬时拉伸。
   */
  it("should_keep_preview_tile_square_when_folder_shape_changes", () => {
    const style = buildFolderPreviewItemStyle({
      maxIconSize: 64,
      innerBorderRadius: 20,
      isDragging: false,
    });

    expect(style.width).toBe("min(100%, 64px)");
    expect(style.aspectRatio).toBe("1 / 1");
  });

  /**
   * 目的：拖拽态依然需要透明度反馈，且不影响方形约束。
   */
  it("should_apply_dragging_opacity_without_breaking_square_constraint", () => {
    const style = buildFolderPreviewItemStyle({
      maxIconSize: 32,
      innerBorderRadius: 12,
      isDragging: true,
    });

    expect(style.opacity).toBe(0);
    expect(style.aspectRatio).toBe("1 / 1");
  });
});

