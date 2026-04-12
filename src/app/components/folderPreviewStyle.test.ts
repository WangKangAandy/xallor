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

  /**
   * 目的：底色/阴影/悬停已迁至 `theme.css` 的 `.glass-folder-preview-tile`，内联 style 不再写 background，避免与类优先级冲突。
   */
  it("should_not_inline_background_or_box_shadow_when_tokens_own_visuals", () => {
    const style = buildFolderPreviewItemStyle({
      maxIconSize: 48,
      innerBorderRadius: 16,
      isDragging: false,
    });
    expect(style.background).toBeUndefined();
    expect(style.boxShadow).toBeUndefined();
  });
});

