import type { ReactNode } from "react";
import { forwardRef } from "react";
import { motion } from "motion/react";
import { DesktopGridResizeChrome } from "./DesktopGridResizeChrome";
import type { FolderResizeHandle } from "./useFolderResize";

export type GridItemCardFrameProps = {
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
};

/**
 * 网格卡片外框：react-dnd 的 `drag(drop(ref))` 必须挂在**原生 div** 上，不要挂在 `motion.div` 上。
 * Motion 在 reconcile 时会与 `connectDragSource` 写入的 `draggable`/拖拽监听产生冲突，导致
 * `beginDrag` 无法建立、浏览器表现为完全拖不动（无半透明预览）。
 *
 * 使用 `forwardRef`：在 React 18 中 `ref` 不是普通 props，`{...shell}` 里的 ref 只会传给 `forwardRef` 组件。
 */
export const GridItemCardFrame = forwardRef<HTMLDivElement, GridItemCardFrameProps>(function GridItemCardFrame(
  {
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
  },
  ref,
) {
  const { isBorderHovered, setIsBorderHovered, isResizing, startResize } = folderResize;

  return (
    <div
      ref={ref}
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
      <motion.div
        layout="position"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity, scale: isMergeTarget ? 1.05 : 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="relative flex h-full w-full items-center justify-center"
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
    </div>
  );
});
