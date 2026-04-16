import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { AddIconDialog, GridAddSlotCell, type AddIconSubmitPayload } from "./addIcon";
import { DesktopGridItem } from "./DesktopGridItem";
import { DesktopGridFolderPortal } from "./DesktopGridFolderPortal";
import type { GridItemType, GridShape, FolderItem } from "./desktopGridTypes";
import type { GridDnDDragItem } from "./desktopGridDnDTypes";
import { GRID_CELL_SIZE, GRID_GAP } from "./desktopGridConstants";
import { removeGridItemById, removeSiteFromFolderByUrl } from "./desktopGridItemActions";
import { useGridDnD } from "./useGridDnD";
import { createGridItemFromAddPayload } from "./widgets/createGridItemFromAddPayload";
import type { ArrangeSessionController } from "./arrange/useArrangeSession";
import { createFolderSiteArrangeId } from "./arrange/arrangeItemIds";
import {
  deleteItemsByArrangeSelection,
  getSelectableArrangeIdsFromGridItem,
} from "./arrange/arrangeCommands";
import { useArrangeGestureController } from "./arrange/useArrangeGestureController";
import { useGridBackgroundContextMenu } from "./useGridBackgroundContextMenu";
import {
  resolveCompactionStrategy,
  resolveConflictStrategy,
  type WidgetConflictStrategy,
  type WidgetPageLayoutState,
} from "./widgets/layoutSchema";

export type DesktopGridProps = {
  pageId?: string;
  arrangeSession: ArrangeSessionController;
  items: GridItemType[];
  setItems: React.Dispatch<React.SetStateAction<GridItemType[]>>;
  showLabels: boolean;
  isHydrated: boolean;
  widgetLayout?: WidgetPageLayoutState;
  /** 单路径模式兼容保留：当前不由 DesktopGrid 主动回写 layout。 */
  onChangeWidgetLayout?: (layout: WidgetPageLayoutState) => void;
  onToggleAutoCompact?: (enabled: boolean) => void;
  onChangeConflictStrategy?: (strategy: WidgetConflictStrategy) => void;
};

function GridDropZone({
  onDropEmpty,
  children,
}: {
  onDropEmpty: (item: unknown) => void;
  children: React.ReactNode;
}) {
  const [, drop] = useDrop({
    accept: "ITEM",
    drop: (item, monitor) => {
      if (monitor.didDrop()) return;
      onDropEmpty(item);
    },
  });

  return (
    <div
      data-testid="desktop-grid-dropzone"
      ref={drop}
      className="w-full h-full min-h-[500px]"
    >
      {children}
    </div>
  );
}

export function DesktopGrid({
  pageId,
  arrangeSession,
  items,
  setItems,
  showLabels,
  isHydrated,
  widgetLayout,
  onChangeWidgetLayout: _onChangeWidgetLayout,
  onToggleAutoCompact,
  onChangeConflictStrategy,
}: DesktopGridProps) {
  const pinnedItemIds = useMemo(
    () => new Set((widgetLayout?.layout ?? []).filter((entry) => entry.mode === "pinned").map((entry) => entry.id)),
    [widgetLayout],
  );
  const compactionStrategy = resolveCompactionStrategy(widgetLayout);
  const conflictStrategy = resolveConflictStrategy(widgetLayout);
  const autoCompactEnabled = compactionStrategy === "compact";
  const layoutOrderedItems = useMemo(() => items, [items]);

  const { mergeIntent, handleReorder, handleHoverMergeIntent, handleClearMergeIntent, handleDropItem } =
    useGridDnD(setItems, { compactionStrategy, conflictStrategy, pinnedItemIds });

  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [isFolderDragging, setIsFolderDragging] = useState(false);
  const [addIconOpen, setAddIconOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const handleRename = useCallback(
    (id: string, newName: string) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            if (item.type === "site") {
              return { ...item, site: { ...item.site, name: newName } };
            }
            if (item.type === "folder") {
              return { ...item, name: newName };
            }
          }
          return item;
        }),
      );
    },
    [setItems],
  );

  const handleRenameInnerItem = useCallback(
    (folderId: string, siteUrl: string, newName: string) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.type === "folder" && item.id === folderId) {
            return {
              ...item,
              sites: item.sites.map((site) => (site.url === siteUrl ? { ...site, name: newName } : site)),
            };
          }
          return item;
        }),
      );
    },
    [setItems],
  );
  const handleDeleteInnerItem = useCallback(
    (folderId: string, siteUrl: string) => {
      setItems((prev) => removeSiteFromFolderByUrl(prev, folderId, siteUrl));
    },
    [setItems],
  );

  const handleResize = useCallback(
    (id: string, newShape: GridShape) => {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, shape: newShape } : item)));
    },
    [setItems],
  );

  const handleDeleteItem = useCallback(
    (id: string) => {
      setItems((prev) => removeGridItemById(prev, id));
      setOpenFolderId((cur) => (cur === id ? null : cur));
    },
    [setItems],
  );
  const handleDeleteSelectedInArrangeMode = useCallback(() => {
    if (!arrangeSession.state.isArrangeMode || arrangeSession.state.selectedIds.size === 0) return;
    setItems((prev) => deleteItemsByArrangeSelection(prev, arrangeSession.state.selectedIds));
    arrangeSession.clearSelection();
  }, [arrangeSession, setItems]);

  const handleConfirmAddFromPicker = useCallback(
    (payload: AddIconSubmitPayload) => {
      setItems((prev) => {
        const item = createGridItemFromAddPayload(payload);
        return [...prev, item];
      });
    },
    [setItems],
  );

  const openFolder = openFolderId ? (items.find((i) => i.id === openFolderId) as FolderItem | undefined) : undefined;
  const getFolderChildArrangeIds = useCallback((folder: FolderItem) => {
    return getSelectableArrangeIdsFromGridItem(folder);
  }, []);
  const isFolderSelectedInArrange = useCallback(
    (folder: FolderItem) => {
      const childIds = getFolderChildArrangeIds(folder);
      if (childIds.length === 0) return false;
      // 外层文件夹仅展示二值状态：内部任意命中都视为“选中”。
      return childIds.some((id) => arrangeSession.state.selectedIds.has(id));
    },
    [arrangeSession.state.selectedIds, getFolderChildArrangeIds],
  );
  const toggleFolderArrangeSelection = useCallback(
    (folder: FolderItem) => {
      const childIds = getFolderChildArrangeIds(folder);
      const hasAnySelected = childIds.some((id) => arrangeSession.state.selectedIds.has(id));
      // 外层点击切换：已选（含部分）-> 全取消；未选 -> 全选。
      arrangeSession.setManySelected(childIds, !hasAnySelected);
    },
    [arrangeSession, arrangeSession.state.selectedIds, getFolderChildArrangeIds],
  );
  const isEmptyGrid = items.length === 0;
  const findItemById = useCallback((id: string) => items.find((item) => item.id === id), [items]);
  const getSelectableIdsFromGridItem = useCallback(
    (gridItemId: string) => {
      const item = findItemById(gridItemId);
      if (!item) return [] as string[];
      return getSelectableArrangeIdsFromGridItem(item);
    },
    [findItemById],
  );
  useArrangeGestureController({
    pageId,
    gridRef,
    arrangeSession,
    resolveSelectableIdsByGridItemId: getSelectableIdsFromGridItem,
  });
  const handleEnterArrangeMode = useCallback(() => {
    arrangeSession.enterArrangeMode(pageId ?? "__single_page__");
  }, [arrangeSession, pageId]);
  const handleExitArrangeMode = useCallback(() => {
    arrangeSession.exitArrangeMode();
  }, [arrangeSession]);
  useEffect(() => {
    if (!arrangeSession.state.isArrangeMode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        handleDeleteSelectedInArrangeMode();
        return;
      }
      if (event.key !== "Escape") return;
      event.preventDefault();
      arrangeSession.exitArrangeMode();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [arrangeSession, arrangeSession.state.isArrangeMode, handleDeleteSelectedInArrangeMode]);
  const { onContextMenu: onBackgroundContextMenu, portal: backgroundMenuPortal } =
    useGridBackgroundContextMenu(handleEnterArrangeMode);
  // 网格项 z-index 数值见 desktopGridLayers.ts（DesktopGridItem inline style）
  return (
    <DndProvider backend={HTML5Backend}>
      {arrangeSession.state.isSelecting && arrangeSession.state.selectionRect ? (
        <div className="pointer-events-none fixed inset-0 z-[95]" aria-hidden>
          <div
            className="absolute border border-blue-400/80 bg-blue-500/15"
            style={{
              left: arrangeSession.state.selectionRect.x,
              top: arrangeSession.state.selectionRect.y,
              width: arrangeSession.state.selectionRect.w,
              height: arrangeSession.state.selectionRect.h,
            }}
          />
        </div>
      ) : null}
      <GridDropZone onDropEmpty={(item) => handleDropItem(item as GridDnDDragItem, "GRID_END", false)}>
        <div className="flex w-full flex-col gap-3">
          <div className="relative flex w-full items-center justify-end">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs text-white/90 transition hover:bg-white/20"
                aria-pressed={autoCompactEnabled}
                onClick={() => onToggleAutoCompact?.(!autoCompactEnabled)}
              >
                自动补位：{autoCompactEnabled ? "开" : "关"}
              </button>
              <button
                type="button"
                className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs text-white/90 transition hover:bg-white/20"
                onClick={() =>
                  onChangeConflictStrategy?.(
                    conflictStrategy === "eject" ? "swap" : conflictStrategy === "swap" ? "reject" : "eject",
                  )
                }
              >
                冲突策略：
                {conflictStrategy === "eject" ? "挤出" : conflictStrategy === "swap" ? "交换" : "拒绝"}
              </button>
            </div>
            {arrangeSession.state.isArrangeMode ? (
              <button
                type="button"
                aria-label="退出整理模式"
                title="退出整理模式（Esc）"
                className="absolute right-0 top-0 z-[2] flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-black/25 text-sm text-white transition hover:bg-black/40"
                onClick={handleExitArrangeMode}
              >
                ×
              </button>
            ) : null}
          </div>
          <div
            onContextMenu={onBackgroundContextMenu}
            style={{
              paddingBottom: "100px",
              width: "100%",
              margin: "0 auto",
              transition: "gap 0.3s ease-in-out",
            }}
          >
            <div className="flex justify-center">
              <div
                ref={gridRef}
                style={{
                  display: "grid",
                  width: "100%",
                  // 恢复稳定的单路径网格：auto-fill + 居中 + 固定 gap。
                  gridTemplateColumns: `repeat(auto-fill, ${GRID_CELL_SIZE}px)`,
                  gridAutoRows: `${GRID_CELL_SIZE}px`,
                  gap: `${GRID_GAP}px`,
                  justifyContent: "center",
                  gridAutoFlow: "dense",
                }}
              >
                {isHydrated &&
                  layoutOrderedItems.map((item, i) => (
                    <DesktopGridItem
                      key={item.id}
                      item={item}
                      index={i}
                      onReorder={handleReorder}
                      onHoverMergeIntent={handleHoverMergeIntent}
                      onClearMergeIntent={handleClearMergeIntent}
                      onDropItem={handleDropItem}
                      isMergeTarget={mergeIntent?.targetId === item.id && mergeIntent?.draggedId !== item.id}
                      onResize={handleResize}
                      onOpenFolder={(id) => setOpenFolderId(id)}
                      showLabels={showLabels}
                      onRename={handleRename}
                      onDeleteItem={handleDeleteItem}
                      onEnterArrangeMode={handleEnterArrangeMode}
                      isArrangeMode={arrangeSession.state.isArrangeMode}
                      isArrangeSelected={
                        item.type === "folder"
                          ? isFolderSelectedInArrange(item)
                          : arrangeSession.state.selectedIds.has(item.id)
                      }
                      onArrangeToggleSelect={() =>
                        item.type === "folder" ? toggleFolderArrangeSelection(item) : arrangeSession.toggleSelect(item.id)
                      }
                    />
                  ))}
                {isHydrated ? <GridAddSlotCell onOpenAdd={() => setAddIconOpen(true)} alwaysVisible={isEmptyGrid} /> : null}
              </div>
            </div>
          </div>
        </div>
      </GridDropZone>

      <AddIconDialog
        open={addIconOpen}
        onOpenChange={setAddIconOpen}
        contextSiteId={null}
        onConfirmAdd={handleConfirmAddFromPicker}
      />

      {openFolder && (
        <DesktopGridFolderPortal
          folder={openFolder}
          showLabels={showLabels}
          isFolderDragging={isFolderDragging}
          onClose={() => setOpenFolderId(null)}
          onRenameFolder={(newName) => handleRename(openFolder.id, newName)}
          onRenameInnerSite={(siteUrl, newName) => handleRenameInnerItem(openFolder.id, siteUrl, newName)}
          isArrangeMode={arrangeSession.state.isArrangeMode}
          isArrangeSelected={(siteUrl) =>
            arrangeSession.state.selectedIds.has(createFolderSiteArrangeId(openFolder.id, siteUrl))
          }
          onArrangeToggleSelect={(siteUrl) =>
            arrangeSession.toggleSelect(createFolderSiteArrangeId(openFolder.id, siteUrl))
          }
          onDeleteInnerSite={(siteUrl) => handleDeleteInnerItem(openFolder.id, siteUrl)}
          onInnerDragStart={() => setIsFolderDragging(true)}
          onInnerDragEnd={() => {
            setIsFolderDragging(false);
            setOpenFolderId(null);
          }}
        />
      )}
      {backgroundMenuPortal}
    </DndProvider>
  );
}
