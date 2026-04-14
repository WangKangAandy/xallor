import { useCallback, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { FolderItem, GridItemType, SiteItem } from "./desktopGridTypes";
import type { GridDnDDragItem } from "./desktopGridDnDTypes";
import type { WidgetCompactionStrategy, WidgetConflictStrategy } from "./widgets/layoutSchema";
import { removeSiteFromFolderByUrl } from "./desktopGridItemActions";

export type MergeIntent = { targetId: string; draggedId: string };
type ReorderPolicy = {
  compactionStrategy: WidgetCompactionStrategy;
  conflictStrategy: WidgetConflictStrategy;
  pinnedItemIds?: Set<string>;
};

/** 与 hover 离开单元格时「清除合并意图」逻辑一致；供单测与 hook 共用。 */
export function resolveMergeIntentAfterClear(prev: MergeIntent | null, id?: string): MergeIntent | null {
  if (!id || prev?.targetId === id) return null;
  return prev;
}

export function reorderGridItems(items: GridItemType[], draggedId: string, hoverId: string): GridItemType[] {
  const dragIdx = items.findIndex((i) => i.id === draggedId);
  const hoverIdx = items.findIndex((i) => i.id === hoverId);
  if (dragIdx === -1 || hoverIdx === -1 || dragIdx === hoverIdx) return items;
  const next = [...items];
  const [removed] = next.splice(dragIdx, 1);
  next.splice(hoverIdx, 0, removed);
  return next;
}

export function reorderGridItemsByPolicy(
  items: GridItemType[],
  draggedId: string,
  hoverId: string,
  policy: ReorderPolicy,
): GridItemType[] {
  if (policy.compactionStrategy === "no-compact") return items;
  const pinnedIds = policy.pinnedItemIds ?? new Set<string>();
  if (pinnedIds.has(draggedId) || pinnedIds.has(hoverId)) {
    return items;
  }
  if (policy.conflictStrategy === "reject") return items;
  if (policy.conflictStrategy === "swap") {
    const dragIdx = items.findIndex((i) => i.id === draggedId);
    const hoverIdx = items.findIndex((i) => i.id === hoverId);
    if (dragIdx === -1 || hoverIdx === -1 || dragIdx === hoverIdx) return items;
    const next = [...items];
    [next[dragIdx], next[hoverIdx]] = [next[hoverIdx], next[dragIdx]];
    return next;
  }
  return reorderGridItems(items, draggedId, hoverId);
}

export function useGridDnD(
  setItems: Dispatch<SetStateAction<GridItemType[]>>,
  options?: {
    compactionStrategy?: WidgetCompactionStrategy;
    conflictStrategy?: WidgetConflictStrategy;
    pinnedItemIds?: Set<string>;
  },
) {
  const [mergeIntent, setMergeIntentState] = useState<MergeIntent | null>(null);
  const mergeIntentRef = useRef<MergeIntent | null>(null);
  const compactionStrategy = options?.compactionStrategy ?? "compact";
  const conflictStrategy = options?.conflictStrategy ?? "eject";
  const pinnedItemIds = options?.pinnedItemIds;

  const setMergeIntent = useCallback((intent: MergeIntent | null) => {
    mergeIntentRef.current = intent;
    setMergeIntentState(intent);
  }, []);

  const handleReorder = useCallback(
    (draggedId: string, hoverId: string) => {
      setItems((prev) =>
        reorderGridItemsByPolicy(prev, draggedId, hoverId, { compactionStrategy, conflictStrategy, pinnedItemIds }),
      );
    },
    [setItems, compactionStrategy, conflictStrategy, pinnedItemIds],
  );

  const handleHoverMergeIntent = useCallback(
    (hoverId: string, draggedId: string) => {
      setMergeIntent({ targetId: hoverId, draggedId });
    },
    [setMergeIntent],
  );

  const handleClearMergeIntent = useCallback((id?: string) => {
    setMergeIntentState((prev) => {
      const next = resolveMergeIntentAfterClear(prev, id);
      mergeIntentRef.current = next;
      return next;
    });
  }, []);

  const handleDropItem = useCallback(
    (draggedItem: GridDnDDragItem, targetId: string, inCenterZone?: boolean) => {
      const currentIntent = mergeIntentRef.current;

      const isIntentActive =
        currentIntent && currentIntent.targetId === targetId && currentIntent.draggedId === draggedItem.id;

      if (draggedItem.type === "folder-site" && draggedItem.site) {
        const movedSite = draggedItem.site;
        setItems((prev) => {
          const sourceFolderIdx = prev.findIndex((i) => i.id === draggedItem.sourceFolderId);
          if (sourceFolderIdx === -1) return prev;
          const targetIdx = prev.findIndex((i) => i.id === targetId);
          const newItems = removeSiteFromFolderByUrl(prev, draggedItem.sourceFolderId, movedSite.url);

          const newSiteItem: SiteItem = {
            id: `site-${Date.now()}`,
            type: "site",
            shape: { cols: 1, rows: 1 },
            site: movedSite,
          };

          const targetItem = newItems.find((i) => i.id === targetId);
          if (targetItem && inCenterZone && targetItem.type === "folder") {
            targetItem.sites.push(movedSite);
          } else if (targetItem && inCenterZone && targetItem.type === "site") {
            const newFolder: FolderItem = {
              id: `folder-${Date.now()}`,
              type: "folder",
              shape: { cols: 2, rows: 1 },
              name: "新建文件夹",
              colorFrom: "rgba(147,197,253,0.75)",
              colorTo: "rgba(99,102,241,0.75)",
              sites: [targetItem.site, movedSite],
            };
            const actualTargetIdx = newItems.findIndex((i) => i.id === targetId);
            newItems[actualTargetIdx] = newFolder;
          } else {
            const insertIdx = targetIdx !== -1 ? targetIdx : newItems.length;
            newItems.splice(insertIdx, 0, newSiteItem);
          }

          return newItems;
        });
        setMergeIntent(null);
        return;
      }

      if (isIntentActive || inCenterZone) {
        setItems((prev) => {
          const dragIdx = prev.findIndex((i) => i.id === draggedItem.id);
          const targetIdx = prev.findIndex((i) => i.id === targetId);
          if (dragIdx === -1 || targetIdx === -1 || dragIdx === targetIdx) return prev;

          const draggedItemData = prev[dragIdx];
          const targetItem = prev[targetIdx];

          if (draggedItemData.type !== "site") return prev;

          const newItems = [...prev];
          let merged = false;

          if (targetItem.type === "site") {
            const newFolder: FolderItem = {
              id: `folder-${Date.now()}`,
              type: "folder",
              shape: { cols: 2, rows: 1 },
              name: "新建文件夹",
              colorFrom: "rgba(147,197,253,0.75)",
              colorTo: "rgba(99,102,241,0.75)",
              sites: [targetItem.site, draggedItemData.site],
            };
            newItems[targetIdx] = newFolder;
            merged = true;
          } else if (targetItem.type === "folder") {
            const updatedFolder: FolderItem = {
              ...targetItem,
              sites: [...targetItem.sites, draggedItemData.site],
            };
            newItems[targetIdx] = updatedFolder;
            merged = true;
          }

          if (merged) {
            newItems.splice(dragIdx, 1);
          }
          return newItems;
        });
      }
      setMergeIntent(null);
    },
    [setItems, setMergeIntent],
  );

  return {
    mergeIntent,
    handleReorder,
    handleHoverMergeIntent,
    handleClearMergeIntent,
    handleDropItem,
  };
}
