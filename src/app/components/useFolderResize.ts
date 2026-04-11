import { useCallback, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { GridShape } from "./desktopGridTypes";
import { computeResizedShape } from "./folderResizeRules";
import { computeResizePreviewSize } from "./resizePreview";
import { normalizeFolderPreviewGrid, shouldActivateResizeAnchor } from "./folderPreviewLayout";

type ResizeVariant = "folder" | "widget";

export function useFolderResize(options: {
  itemId: string;
  shape: GridShape;
  variant: ResizeVariant;
  /** 仅 folder 使用，用于 `computeResizedShape` 与最大行列。 */
  folderSiteCount: number;
  onResize: (id: string, newShape: GridShape) => void;
}) {
  const { itemId, shape, variant, folderSiteCount, onResize } = options;

  const [isBorderHovered, setIsBorderHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizePreview, setResizePreview] = useState<{ width: number; height: number } | null>(null);
  const pendingShapeRef = useRef<GridShape | null>(null);
  const [activeResizeDir, setActiveResizeDir] = useState<string | null>(null);
  const resizeEngagedRef = useRef(false);
  const resizeFolderStartRef = useRef<GridShape | null>(null);
  const [resizeFolderPending, setResizeFolderPending] = useState<GridShape | null>(null);

  const startResize = useCallback(
    (e: ReactPointerEvent, dir: string) => {
      e.stopPropagation();
      e.preventDefault();
      resizeEngagedRef.current = false;
      if (variant === "folder") {
        resizeFolderStartRef.current = { ...shape };
        setResizeFolderPending(normalizeFolderPreviewGrid(shape));
      }
      const startX = e.clientX;
      const startY = e.clientY;
      const startCols = shape.cols;
      const startRows = shape.rows;
      const startShape = { cols: startCols, rows: startRows };
      const lastShapeRef = { current: { cols: startCols, rows: startRows } };
      const maxCols =
        variant === "folder"
          ? folderSiteCount <= 4
            ? 2
            : folderSiteCount <= 6
              ? 3
              : 4
          : 4;
      const maxRows =
        variant === "folder"
          ? folderSiteCount <= 4
            ? 2
            : folderSiteCount <= 6
              ? 3
              : 4
          : 4;

      const onPointerMove = (moveEvent: PointerEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        if (!resizeEngagedRef.current && shouldActivateResizeAnchor(deltaX, deltaY)) {
          resizeEngagedRef.current = true;
          setActiveResizeDir(dir);
        }

        const previewSize = computeResizePreviewSize({
          startCols,
          startRows,
          deltaX,
          deltaY,
          dir,
          maxCols,
          maxRows,
        });
        setResizePreview(previewSize);

        const nextShape = computeResizedShape({
          startShape,
          baseShape: lastShapeRef.current,
          deltaX,
          deltaY,
          dir,
          isFolder: variant === "folder",
          siteCount: folderSiteCount,
        });

        if (variant === "folder") {
          setResizeFolderPending(nextShape);
        }

        if (nextShape.cols !== lastShapeRef.current.cols || nextShape.rows !== lastShapeRef.current.rows) {
          lastShapeRef.current = nextShape;
          pendingShapeRef.current = nextShape;
        }
      };

      const onPointerUp = () => {
        resizeEngagedRef.current = false;
        setIsResizing(false);
        setIsBorderHovered(false);
        setResizePreview(null);
        if (
          pendingShapeRef.current &&
          (pendingShapeRef.current.cols !== shape.cols || pendingShapeRef.current.rows !== shape.rows)
        ) {
          onResize(itemId, pendingShapeRef.current);
        }
        pendingShapeRef.current = null;
        setActiveResizeDir(null);
        if (variant === "folder") {
          resizeFolderStartRef.current = null;
          setResizeFolderPending(null);
        }
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };

      setIsResizing(true);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [itemId, shape, variant, folderSiteCount, onResize],
  );

  return {
    isBorderHovered,
    setIsBorderHovered,
    isResizing,
    resizePreview,
    activeResizeDir,
    resizeFolderPending,
    resizeFolderStartRef,
    startResize,
  };
}

export type FolderResizeHandle = ReturnType<typeof useFolderResize>;
