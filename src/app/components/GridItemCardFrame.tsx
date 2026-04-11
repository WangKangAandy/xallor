import type { ReactNode, RefObject } from "react";
import { motion } from "motion/react";
import { DesktopGridResizeChrome } from "./DesktopGridResizeChrome";
import type { FolderResizeHandle } from "./useFolderResize";

export function GridItemCardFrame({
  ref,
  gridColumn,
  gridRow,
  renderSize,
  zIndex,
  opacity,
  isMergeTarget,
  isDragging,
  showResizeChrome,
  folderResize,
  children,
}: {
  ref: RefObject<HTMLDivElement | null>;
  gridColumn: string;
  gridRow: string;
  renderSize: { width: number; height: number };
  zIndex: number;
  opacity: number;
  isMergeTarget: boolean;
  isDragging: boolean;
  showResizeChrome: boolean;
  folderResize: FolderResizeHandle;
  children: ReactNode;
}) {
  const { isBorderHovered, setIsBorderHovered, isResizing, startResize } = folderResize;

  return (
    <motion.div
      ref={ref}
      layout="position"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity, scale: isMergeTarget ? 1.05 : 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      style={{
        gridColumn,
        gridRow,
        width: renderSize.width,
        height: renderSize.height,
        zIndex,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      className="relative group flex items-center justify-center"
    >
      {showResizeChrome && (
        <DesktopGridResizeChrome
          isDragging={isDragging}
          isBorderHovered={isBorderHovered}
          isResizing={isResizing}
          setIsBorderHovered={setIsBorderHovered}
          startResize={startResize}
        />
      )}
      {children}
    </motion.div>
  );
}
