import { GRID_CELL_SIZE, GRID_GAP } from "./desktopGridConstants";

function spanToPixels(span: number): number {
  return span * GRID_CELL_SIZE + (span - 1) * GRID_GAP;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function computeResizePreviewSize(params: {
  startCols: number;
  startRows: number;
  deltaX: number;
  deltaY: number;
  dir: string;
  maxCols: number;
  maxRows: number;
}): { width: number; height: number } {
  const { startCols, startRows, deltaX, deltaY, dir, maxCols, maxRows } = params;
  const minWidth = spanToPixels(1);
  const minHeight = spanToPixels(1);
  const maxWidth = spanToPixels(maxCols);
  const maxHeight = spanToPixels(maxRows);

  const startWidth = spanToPixels(startCols);
  const startHeight = spanToPixels(startRows);

  let width = startWidth;
  let height = startHeight;

  if (dir.includes("right")) width = startWidth + deltaX;
  else if (dir.includes("left")) width = startWidth - deltaX;

  if (dir.includes("bottom")) height = startHeight + deltaY;
  else if (dir.includes("top")) height = startHeight - deltaY;

  return {
    width: clamp(width, minWidth, maxWidth),
    height: clamp(height, minHeight, maxHeight),
  };
}

export function shapeToPixels(cols: number, rows: number): { width: number; height: number } {
  return {
    width: spanToPixels(cols),
    height: spanToPixels(rows),
  };
}

