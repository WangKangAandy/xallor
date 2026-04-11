import type { GridShape } from "./desktopGridTypes";
import { GRID_STEP } from "./desktopGridConstants";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function constrainFolderShapeForSiteCount(shape: GridShape, siteCount: number): GridShape {
  let cols = shape.cols;
  let rows = shape.rows;

  if (siteCount <= 4) {
    cols = Math.min(cols, 2);
    rows = Math.min(rows, 2);
    return { cols, rows };
  }

  if (siteCount <= 6) {
    cols = Math.min(cols, 3);
    rows = Math.min(rows, 3);
    // Prevent 3x3 for folders with <= 6 sites.
    if (cols === 3 && rows === 3) {
      if (shape.rows >= shape.cols) rows = 2;
      else cols = 2;
    }
    return { cols, rows };
  }

  return { cols, rows };
}

export function computeResizedShape(params: {
  startShape: GridShape;
  baseShape: GridShape;
  deltaX: number;
  deltaY: number;
  dir: string;
  isFolder: boolean;
  siteCount?: number;
}): GridShape {
  const { startShape, baseShape, deltaX, deltaY, dir, isFolder, siteCount = 0 } = params;
  const stepCols = Math.round(deltaX / GRID_STEP);
  const stepRows = Math.round(deltaY / GRID_STEP);

  let cols = startShape.cols;
  let rows = startShape.rows;

  if (dir.includes("right")) cols = startShape.cols + stepCols;
  else if (dir.includes("left")) cols = startShape.cols - stepCols;

  if (dir.includes("bottom")) rows = startShape.rows + stepRows;
  else if (dir.includes("top")) rows = startShape.rows - stepRows;

  cols = clamp(cols, 1, 4);
  rows = clamp(rows, 1, 4);

  if (!isFolder) return { cols, rows };

  const constrained = constrainFolderShapeForSiteCount({ cols, rows }, siteCount);
  if (constrained.cols === baseShape.cols && constrained.rows === baseShape.rows) {
    return baseShape;
  }
  return constrained;
}

