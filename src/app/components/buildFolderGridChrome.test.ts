import type { MutableRefObject } from "react";
import { describe, expect, it } from "vitest";
import { buildFolderGridChrome } from "./buildFolderGridChrome";
import { shapeToPixels } from "./resizePreview";
import { normalizeFolderPreviewGrid } from "./folderPreviewLayout";

/**
 * 目的：1×1 文件夹在静态布局下应归一化为 2×2 预览栅格，与历史 DesktopGridItem 行为一致。
 */
describe("buildFolderGridChrome", () => {
  it("should_normalize_1x1_folder_to_2x2_canvas_grid_when_not_resizing", () => {
    const item = {
      id: "f1",
      type: "folder" as const,
      name: "Test",
      shape: { cols: 1, rows: 1 },
      sites: [
        { name: "a", url: "https://a.com", domain: "a.com" },
        { name: "b", url: "https://b.com", domain: "b.com" },
      ],
    };
    const renderSize = shapeToPixels(1, 1);
    const resizeFolderStartRef: MutableRefObject<{ cols: number; rows: number } | null> = { current: null };

    const chrome = buildFolderGridChrome({
      item,
      renderSize,
      resizePreview: null,
      resizeFolderStartRef,
      resizeFolderPending: null,
      activeResizeDir: null,
    });

    expect(chrome.canvasGrid).toEqual(normalizeFolderPreviewGrid(item.shape));
    expect(chrome.previewSites.length).toBeGreaterThan(0);
  });
});
