import type { GridShape } from "./desktopGridTypes";
import { GRID_CELL_SIZE, GRID_GAP, GRID_STEP } from "./desktopGridConstants";
import { constrainFolderShapeForSiteCount } from "./folderResizeRules";
import { shapeToPixels } from "./resizePreview";

/** 超过该像素位移后才进入「边锚 + 抽屉裁切」模式，避免按下瞬间从居中跳到贴边 */
export const RESIZE_DRAG_THRESHOLD_PX = 3;

export function getPreviewCountForShape(cols: number, rows: number): number {
  if (cols === 1 && rows === 1) return 4;
  if (cols === 4 && rows === 1) return 4;
  if (cols === 1 && rows === 4) return 4;
  return cols * rows;
}

export function getFloatSpansFromPixels(width: number, height: number): { colsFloat: number; rowsFloat: number } {
  const step = GRID_CELL_SIZE + GRID_GAP;
  return {
    colsFloat: (width + GRID_GAP) / step,
    rowsFloat: (height + GRID_GAP) / step,
  };
}

/** 与 DesktopGridItem 一致：1×1 文件夹预览按 2×2 迷你格渲染 */
export function normalizeFolderPreviewGrid(shape: GridShape): GridShape {
  if (shape.cols === 1 && shape.rows === 1) return { cols: 2, rows: 2 };
  return { cols: shape.cols, rows: shape.rows };
}

/**
 * 由裁切像素反推「当前高度/宽度能完整容纳」的最大占格数（floor，与 spanToPixels 一致）。
 * 若误用 ceil，高度从 2 行略增 1px 就会变成 3 行，第三行图标会瞬间出现（用户反馈的「稍微下拉就 6 个」）。
 */
export function inferGridShapeFromPixelSize(width: number, height: number): GridShape {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  const cols = Math.max(1, Math.min(4, Math.floor((w + GRID_GAP) / GRID_STEP)));
  const rows = Math.max(1, Math.min(4, Math.floor((h + GRID_GAP) / GRID_STEP)));
  return { cols, rows };
}

/**
 * 抽拉内容栅格：
 * - `infer` 用 **floor**：与 spanToPixels 一致，避免高度刚过 2 行就 ceil 成 3 行（「稍微下拉就 6 个」）。
 * - `pending` 可能先于像素跳格，用 `min(pending, infer)` 与 max 合并，扩张时以像素为准，收缩时仍保持 max(drag, commit, infer)。
 */
export function computeDrawerContentShape(params: {
  committedShape: GridShape;
  dragStartShape: GridShape;
  livePendingShape: GridShape | null;
  resizePreview: { width: number; height: number };
  siteCount: number;
}): GridShape {
  const { committedShape, dragStartShape, livePendingShape, resizePreview, siteCount } = params;
  const pending = normalizeFolderPreviewGrid(livePendingShape ?? dragStartShape);
  const inferred = inferGridShapeFromPixelSize(resizePreview.width, resizePreview.height);
  const cols = Math.max(
    dragStartShape.cols,
    committedShape.cols,
    inferred.cols,
    Math.min(pending.cols, inferred.cols),
  );
  const rows = Math.max(
    dragStartShape.rows,
    committedShape.rows,
    inferred.rows,
    Math.min(pending.rows, inferred.rows),
  );
  return constrainFolderShapeForSiteCount({ cols, rows }, siteCount);
}

/** 映射到 CSS：竖直 start=顶对齐，end=底对齐；水平 start=左对齐，end=右对齐 */
export type DrawerContentAnchor = "start" | "end" | "center";

const ANCHOR_EPS_PX = 0.5;

/**
 * 根据「当前裁切 vs 拖拽起点像素」判断扩张/收缩，再决定定边。
 * 错误做法是对上下沿一律底对齐：从下沿向下扩张时会把内容贴底，出现 1×2 下拉过程中两行图标跑到容器底部、松手又跳回顶部的现象。
 */
export function computeFolderResizeAnchors(params: {
  activeResizeDir: string | null;
  resizePreview: { width: number; height: number } | null;
  dragStartShape: GridShape | null;
}): { vertical: DrawerContentAnchor; horizontal: DrawerContentAnchor } {
  const { activeResizeDir, resizePreview, dragStartShape } = params;
  if (!activeResizeDir || !resizePreview || !dragStartShape) {
    return { vertical: "center", horizontal: "center" };
  }
  const startPx = shapeToPixels(dragStartShape.cols, dragStartShape.rows);
  const expandV = resizePreview.height > startPx.height + ANCHOR_EPS_PX;
  const shrinkV = resizePreview.height < startPx.height - ANCHOR_EPS_PX;
  const expandH = resizePreview.width > startPx.width + ANCHOR_EPS_PX;
  const shrinkH = resizePreview.width < startPx.width - ANCHOR_EPS_PX;

  let vertical: DrawerContentAnchor = "center";
  let horizontal: DrawerContentAnchor = "center";

  if (activeResizeDir.includes("bottom")) {
    if (expandV) vertical = "start";
    else if (shrinkV) vertical = "end";
  } else if (activeResizeDir.includes("top")) {
    if (expandV) vertical = "end";
    else if (shrinkV) vertical = "start";
  }

  if (activeResizeDir.includes("right")) {
    if (expandH) horizontal = "start";
    else if (shrinkH) horizontal = "end";
  } else if (activeResizeDir.includes("left")) {
    if (expandH) horizontal = "end";
    else if (shrinkH) horizontal = "start";
  }

  return { vertical, horizontal };
}

export function computeAdaptiveGap(params: {
  viewport: number;
  slots: number;
  iconSize: number;
  minGap: number;
  maxGap: number;
}): number {
  const { viewport, slots, iconSize, minGap, maxGap } = params;
  if (slots <= 1) return 0;
  const raw = (viewport - slots * iconSize) / (slots - 1);
  return Math.max(minGap, Math.min(maxGap, Number.isFinite(raw) ? raw : minGap));
}

/**
 * 多格文件夹（占格数 > 1）与 1×1 小文件夹的预览档位：影响基准图标与 gap 上下限。
 * 用占格数区分，避免仅按长宽比误判。
 */
export type FolderPreviewTier = "large" | "small";

const TIER = {
  large: { baseIconSize: 64, minIconSize: 48, minGap: 10, maxGap: 28 },
  small: { baseIconSize: 32, minIconSize: 24, minGap: 4, maxGap: 14 },
} as const;

/**
 * 在视口内根据 padding 计算图标尺寸、自适应间距与画布总尺寸；视口不足时逐步缩小 icon 直至容纳或到达下限。
 */
export function computeFolderContentLayout(params: {
  viewportWidth: number;
  viewportHeight: number;
  contentPadding: number;
  cols: number;
  rows: number;
  tier: FolderPreviewTier;
}): {
  iconSize: number;
  horizontalGap: number;
  verticalGap: number;
  canvasWidth: number;
  canvasHeight: number;
} {
  const { viewportWidth, viewportHeight, contentPadding, cols, rows, tier } = params;
  const { baseIconSize, minIconSize, minGap, maxGap } = TIER[tier];
  const innerW = Math.max(0, viewportWidth - 2 * contentPadding);
  const innerH = Math.max(0, viewportHeight - 2 * contentPadding);

  let iconSize: number = baseIconSize;

  for (let attempt = 0; attempt < 32; attempt++) {
    const horizontalGap = cols <= 1 ? 0 : computeAdaptiveGap({ viewport: innerW, slots: cols, iconSize, minGap, maxGap });
    const verticalGap = rows <= 1 ? 0 : computeAdaptiveGap({ viewport: innerH, slots: rows, iconSize, minGap, maxGap });
    const canvasWidth = cols * iconSize + Math.max(0, cols - 1) * horizontalGap;
    const canvasHeight = rows * iconSize + Math.max(0, rows - 1) * verticalGap;
    if (canvasWidth <= innerW && canvasHeight <= innerH) {
      return { iconSize, horizontalGap, verticalGap, canvasWidth, canvasHeight };
    }
    const next = Math.max(minIconSize, iconSize - 2);
    if (next === iconSize) {
      return { iconSize, horizontalGap, verticalGap, canvasWidth, canvasHeight };
    }
    iconSize = next;
  }

  const horizontalGap = cols <= 1 ? 0 : computeAdaptiveGap({ viewport: innerW, slots: cols, iconSize: minIconSize, minGap, maxGap });
  const verticalGap = rows <= 1 ? 0 : computeAdaptiveGap({ viewport: innerH, slots: rows, iconSize: minIconSize, minGap, maxGap });
  const canvasWidth = cols * minIconSize + Math.max(0, cols - 1) * horizontalGap;
  const canvasHeight = rows * minIconSize + Math.max(0, rows - 1) * verticalGap;
  return {
    iconSize: minIconSize,
    horizontalGap,
    verticalGap,
    canvasWidth,
    canvasHeight,
  };
}

/** 预览区圆角 / favicon 相对 icon 的比例（与历史 Figma 档位一致） */
export function getFolderPreviewDecorationScale(tier: FolderPreviewTier): { faviconMul: number; radiusMul: number } {
  return tier === "large"
    ? { faviconMul: 40 / 64, radiusMul: 20 / 64 }
    : { faviconMul: 20 / 32, radiusMul: 12 / 32 };
}

/**
 * 是否应开启 resize 锚定（与 pointer 位移阈值配合，避免仅按下时切换布局）。
 */
export function shouldActivateResizeAnchor(deltaX: number, deltaY: number, thresholdPx: number = RESIZE_DRAG_THRESHOLD_PX): boolean {
  return Math.abs(deltaX) >= thresholdPx || Math.abs(deltaY) >= thresholdPx;
}

export function getCanonicalGridForFolder(params: {
  siteCount: number;
  currentCols: number;
  currentRows: number;
}): { cols: number; rows: number } {
  const { siteCount, currentCols, currentRows } = params;
  if (siteCount <= 4) return { cols: 2, rows: 2 };
  if (siteCount <= 6) {
    return currentRows > currentCols ? { cols: 2, rows: 3 } : { cols: 3, rows: 2 };
  }

  if (currentRows > currentCols) {
    const rows = Math.min(4, Math.max(currentRows, Math.ceil(siteCount / 2)));
    const cols = Math.min(4, Math.max(2, Math.ceil(siteCount / rows)));
    return { cols, rows };
  }

  const cols = Math.min(4, Math.max(currentCols, Math.ceil(siteCount / 2)));
  const rows = Math.min(4, Math.max(2, Math.ceil(siteCount / cols)));
  return { cols, rows };
}
