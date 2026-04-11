import type { CSSProperties, MutableRefObject } from "react";
import type { FolderItem, GridShape } from "./desktopGridTypes";
import { shapeToPixels } from "./resizePreview";
import {
  computeDrawerContentShape,
  computeFolderContentLayout,
  computeFolderResizeAnchors,
  getFolderPreviewDecorationScale,
  getPreviewCountForShape,
  normalizeFolderPreviewGrid,
  type FolderPreviewTier,
} from "./folderPreviewLayout";
import type { FolderTileChrome } from "./DesktopGridItemFolderBody";

export function buildFolderGridChrome(params: {
  item: FolderItem;
  renderSize: { width: number; height: number };
  resizePreview: { width: number; height: number } | null;
  resizeFolderStartRef: MutableRefObject<GridShape | null>;
  resizeFolderPending: GridShape | null;
  activeResizeDir: string | null;
}): FolderTileChrome {
  const { item, renderSize, resizePreview, resizeFolderStartRef, resizeFolderPending, activeResizeDir } = params;

  const isMultiCellFolder = item.shape.cols > 1 || item.shape.rows > 1;
  const previewTier: FolderPreviewTier = isMultiCellFolder ? "large" : "small";
  const contentPadding = isMultiCellFolder ? 20 : 12;

  const committedGrid = normalizeFolderPreviewGrid(item.shape);
  const viewportWidth = Math.max(0, renderSize.width);
  const viewportHeight = Math.max(0, renderSize.height);
  const isFolderDrag = resizePreview !== null && resizeFolderStartRef.current !== null;

  const canvasGrid: GridShape = isFolderDrag
    ? computeDrawerContentShape({
        committedShape: committedGrid,
        dragStartShape: normalizeFolderPreviewGrid(resizeFolderStartRef.current!),
        livePendingShape: resizeFolderPending,
        resizePreview,
        siteCount: item.sites.length,
      })
    : committedGrid;

  const layoutRefSize = shapeToPixels(canvasGrid.cols, canvasGrid.rows);
  const previewCount = Math.min(item.sites.length, getPreviewCountForShape(canvasGrid.cols, canvasGrid.rows));
  const previewSites = item.sites.slice(0, previewCount);

  const { iconSize, horizontalGap, verticalGap, canvasWidth, canvasHeight } = computeFolderContentLayout({
    viewportWidth: isFolderDrag ? layoutRefSize.width : viewportWidth,
    viewportHeight: isFolderDrag ? layoutRefSize.height : viewportHeight,
    contentPadding,
    cols: canvasGrid.cols,
    rows: canvasGrid.rows,
    tier: previewTier,
  });
  const { faviconMul, radiusMul } = getFolderPreviewDecorationScale(previewTier);
  const innerBorderRadius = Math.max(8, Math.round(iconSize * radiusMul));
  const faviconSize = Math.round(iconSize * faviconMul);

  const { vertical: vAnchor, horizontal: hAnchor } = computeFolderResizeAnchors({
    activeResizeDir,
    resizePreview: isFolderDrag ? resizePreview : null,
    dragStartShape: resizeFolderStartRef.current,
  });

  const transforms: string[] = [];
  if (hAnchor === "center") transforms.push("translateX(-50%)");
  if (vAnchor === "center") transforms.push("translateY(-50%)");

  const anchorStyle: CSSProperties = {};
  if (hAnchor === "start") {
    anchorStyle.left = contentPadding;
    anchorStyle.right = "auto";
  } else if (hAnchor === "end") {
    anchorStyle.right = contentPadding;
    anchorStyle.left = "auto";
  } else {
    anchorStyle.left = "50%";
  }

  if (vAnchor === "start") {
    anchorStyle.top = contentPadding;
    anchorStyle.bottom = "auto";
  } else if (vAnchor === "end") {
    anchorStyle.bottom = contentPadding;
    anchorStyle.top = "auto";
  } else {
    anchorStyle.top = "50%";
  }
  if (transforms.length > 0) anchorStyle.transform = transforms.join(" ");

  const gridAlignContent =
    !activeResizeDir ? "center" : vAnchor === "end" ? "end" : vAnchor === "center" ? "center" : "start";
  const gridJustifyContent =
    !activeResizeDir ? "center" : hAnchor === "end" ? "end" : hAnchor === "center" ? "center" : "start";

  return {
    viewportWidth,
    viewportHeight,
    canvasGrid,
    previewSites,
    iconSize,
    horizontalGap,
    verticalGap,
    canvasWidth,
    canvasHeight,
    innerBorderRadius,
    faviconSize,
    anchorStyle,
    gridAlignContent,
    gridJustifyContent,
  };
}
