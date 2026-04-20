import type { ReactNode } from "react";
import { forwardRef, Fragment } from "react";
import { motion } from "motion/react";
import { DesktopGridResizeChrome } from "./DesktopGridResizeChrome";
import type { FolderResizeHandle } from "./useFolderResize";
import { useGridItemContextMenu } from "./useGridItemContextMenu";

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
  /** 与 {@link onDeleteItem} 同时提供时启用右键菜单。 */
  itemId?: string;
  onDeleteItem?: (id: string) => void;
  onHideItem?: (id: string) => void;
  onEnterArrangeMode?: () => void;
  isArrangeMode?: boolean;
  isArrangeSelected?: boolean;
  onArrangeToggleSelect?: () => void;
  children: ReactNode;
};

/**
 * 网格卡片外框：react-dnd 的 `drag(drop(ref))` 必须挂在**原生 div** 上，不要挂在 `motion.div` 上。
 * Motion 在 reconcile 时会与 `connectDragSource` 写入的 `draggable`/拖拽监听产生冲突，导致
 * `beginDrag` 无法建立、浏览器表现为完全拖不动（无半透明预览）。
 *
 * 使用 `forwardRef`：在 React 18 中 `ref` 不是普通 props，`{...shell}` 里的 ref 只会传给 `forwardRef` 组件。
 * 右键菜单的 `onContextMenu` 挂在外层同一 div 上，与 DnD 宿主一致，避免在 motion 子层拦截。
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
    itemId,
    onDeleteItem,
    onHideItem,
    onEnterArrangeMode,
    isArrangeMode = false,
    isArrangeSelected: _isArrangeSelected = false,
    onArrangeToggleSelect,
    children,
  },
  ref,
) {
  const { isBorderHovered, setIsBorderHovered, isResizing, startResize } = folderResize;
  const { onContextMenu, portal } = useGridItemContextMenu(itemId ?? "", onDeleteItem, onHideItem, onEnterArrangeMode);

  return (
    <Fragment>
      <div
        ref={ref}
        data-grid-item-id={itemId}
        onContextMenu={onContextMenu}
        onClickCapture={(event) => {
          if (!isArrangeMode || !itemId) return;
          const target = event.target as HTMLElement | null;
          if (target?.closest("[data-arrange-delete]")) return;
          if (target?.closest("[data-arrange-action]")) return;
          event.preventDefault();
          event.stopPropagation();
          onArrangeToggleSelect?.();
        }}
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
          className={[
            "relative flex h-full w-full items-center justify-center rounded-[24px]",
          ].join(" ")}
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
          {isArrangeMode && itemId ? (
            <>
              <button
                type="button"
                aria-label="删除当前图标"
                data-arrange-delete="true"
                className="absolute right-1.5 top-1.5 z-[2] flex h-5 w-5 items-center justify-center rounded-full border border-white/80 bg-black/20 text-xs text-white transition hover:bg-red-500/80"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteItem?.(itemId);
                }}
              >
                ×
              </button>
            </>
          ) : null}
          {children}
        </motion.div>
      </div>
      {portal}
    </Fragment>
  );
});
