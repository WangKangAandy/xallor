import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GridAddSlotCell } from "./addIcon";
import { DesktopGridItem } from "./DesktopGridItem";
import { DesktopGridFolderPortal } from "./DesktopGridFolderPortal";
import { DesktopGridDropZone } from "./DesktopGridDropZone";
import type { GridItemType, FolderItem } from "./desktopGridTypes";
import type { GridDnDDragItem } from "./desktopGridDnDTypes";
import { GRID_CELL_SIZE, GRID_GAP } from "./desktopGridConstants";
import { useGridDnD } from "./useGridDnD";
import type { ArrangeSessionController } from "./arrange/useArrangeSession";
import { createFolderSiteArrangeId } from "./arrange/arrangeItemIds";
import {
  deleteItemsByArrangeSelection,
  getSelectableArrangeIdsFromGridItem,
  resolveBatchDragIds,
} from "./arrange/arrangeCommands";
import type { ArrangeGestureGridRuntime } from "./arrange/useArrangeGestureController";
import {
  resolveCompactionStrategy,
  resolveConflictStrategy,
  type WidgetConflictStrategy,
  type WidgetPageLayoutState,
} from "./widgets/layoutSchema";
import { useAppI18n } from "../i18n/AppI18n";
import { useDesktopGridItemMutations } from "./useDesktopGridItemMutations";

export type DesktopGridProps = {
  pageId?: string;
  onArrangeRuntimeMount?: (runtime: ArrangeGestureGridRuntime) => void;
  onArrangeRuntimeUnmount?: (gridId: string) => void;
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
  onHideItem?: (id: string) => void;
  onOpenAddFromDesktop?: () => void;
};

export function DesktopGrid({
  pageId,
  onArrangeRuntimeMount,
  onArrangeRuntimeUnmount,
  arrangeSession,
  items,
  setItems,
  showLabels,
  isHydrated,
  widgetLayout,
  onChangeWidgetLayout: _onChangeWidgetLayout,
  onToggleAutoCompact,
  onChangeConflictStrategy,
  onHideItem,
  onOpenAddFromDesktop,
}: DesktopGridProps) {
  const { t } = useAppI18n();
  const pinnedItemIds = useMemo(
    () => new Set((widgetLayout?.layout ?? []).filter((entry) => entry.mode === "pinned").map((entry) => entry.id)),
    [widgetLayout],
  );
  const compactionStrategy = resolveCompactionStrategy(widgetLayout);
  const conflictStrategy = resolveConflictStrategy(widgetLayout);
  const autoCompactEnabled = compactionStrategy === "compact";
  const layoutOrderedItems = useMemo(() => items, [items]);

  const { mergeIntent, handleReorder, handleHoverMergeIntent, handleClearMergeIntent, handleDropItem } =
    useGridDnD(setItems, {
      compactionStrategy,
      conflictStrategy,
      pinnedItemIds,
      selectedIds: arrangeSession.state.isArrangeMode ? arrangeSession.state.selectedIds : undefined,
    });

  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [isFolderDragging, setIsFolderDragging] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const { handleRename, handleRenameInnerItem, handleDeleteInnerItem, handleResize, handleDeleteItem } =
    useDesktopGridItemMutations(setItems, setOpenFolderId);
  const handleDeleteSelectedInArrangeMode = useCallback(() => {
    if (!arrangeSession.state.isArrangeMode || arrangeSession.state.selectedIds.size === 0) return;
    setItems((prev) => deleteItemsByArrangeSelection(prev, arrangeSession.state.selectedIds));
    arrangeSession.clearSelection();
  }, [arrangeSession, setItems]);
  const handleItemDragStart = useCallback(
    (itemId: string) => {
      if (!arrangeSession.state.isArrangeMode) return;
      if (arrangeSession.state.isSelecting) {
        arrangeSession.setSelecting(false);
        arrangeSession.setSelectionRect(null);
      }
      const dragIds = resolveBatchDragIds(items, itemId, arrangeSession.state.selectedIds);
      arrangeSession.startBatchDrag(dragIds);
    },
    [arrangeSession, items],
  );
  const handleItemDragEnd = useCallback(() => {
    if (!arrangeSession.state.isArrangeMode) return;
    arrangeSession.endBatchDrag();
  }, [arrangeSession]);

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
  const getSelectableIdsFromGridItemRef = useRef(getSelectableIdsFromGridItem);
  getSelectableIdsFromGridItemRef.current = getSelectableIdsFromGridItem;
  useEffect(() => {
    if (!pageId || !onArrangeRuntimeMount) return;
    onArrangeRuntimeMount({
      gridId: pageId,
      pageId,
      getRootEl: () => dropZoneRef.current,
      isMounted: () => Boolean(dropZoneRef.current?.isConnected),
      resolveSelectableIdsByGridItemId: (gridItemId: string) => getSelectableIdsFromGridItemRef.current(gridItemId),
    });
    return () => {
      onArrangeRuntimeUnmount?.(pageId);
    };
  }, [pageId, onArrangeRuntimeMount, onArrangeRuntimeUnmount]);
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
  const isCustomContextMenuEnabled = !arrangeSession.state.isArrangeMode;
  // 网格项 z-index 数值见 desktopGridLayers.ts（DesktopGridItem inline style）
  return (
    <>
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
      <DesktopGridDropZone
        onDropEmpty={(item) => handleDropItem(item as GridDnDDragItem, "GRID_END", false)}
        gridId={pageId}
        onDropZoneRef={(el) => {
          dropZoneRef.current = el;
        }}
      >
        <div className="flex w-full flex-col gap-3" data-context-disabled={isCustomContextMenuEnabled ? undefined : "true"}>
          <div className="relative flex w-full items-center justify-end">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs text-white/90 transition hover:bg-white/20"
                aria-pressed={autoCompactEnabled}
                onClick={() => onToggleAutoCompact?.(!autoCompactEnabled)}
              >
                {t("grid.autoCompact")}：{autoCompactEnabled ? t("grid.on") : t("grid.off")}
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
                {t("grid.conflictStrategy")}：
                {conflictStrategy === "eject"
                  ? t("grid.strategyEject")
                  : conflictStrategy === "swap"
                    ? t("grid.strategySwap")
                    : t("grid.strategyReject")}
              </button>
            </div>
            {arrangeSession.state.isArrangeMode ? (
              <button
                type="button"
                aria-label={t("grid.exitArrangeMode")}
                title={t("grid.exitArrangeModeTitle")}
                className="absolute right-0 top-0 z-[2] flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-black/25 text-sm text-white transition hover:bg-black/40"
                onClick={handleExitArrangeMode}
              >
                ×
              </button>
            ) : null}
          </div>
          <div
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
                      onHideItem={onHideItem}
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
                      onDragStart={handleItemDragStart}
                      onDragEnd={handleItemDragEnd}
                    />
                  ))}
                {isHydrated ? (
                  <GridAddSlotCell onOpenAdd={() => onOpenAddFromDesktop?.()} alwaysVisible={isEmptyGrid} />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </DesktopGridDropZone>

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
    </>
  );
}
