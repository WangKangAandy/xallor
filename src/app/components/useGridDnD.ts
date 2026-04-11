import { useCallback, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { FolderItem, GridItemType, SiteItem } from "./desktopGridTypes";
import type { GridDnDDragItem } from "./desktopGridDnDTypes";

export type MergeIntent = { targetId: string; draggedId: string };

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

export function useGridDnD(setItems: Dispatch<SetStateAction<GridItemType[]>>) {
  const [mergeIntent, setMergeIntentState] = useState<MergeIntent | null>(null);
  const mergeIntentRef = useRef<MergeIntent | null>(null);

  const setMergeIntent = useCallback((intent: MergeIntent | null) => {
    mergeIntentRef.current = intent;
    setMergeIntentState(intent);
  }, []);

  const handleReorder = useCallback(
    (draggedId: string, hoverId: string) => {
      setItems((prev) => reorderGridItems(prev, draggedId, hoverId));
    },
    [setItems],
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

          const sourceFolder = prev[sourceFolderIdx] as FolderItem;
          const targetIdx = prev.findIndex((i) => i.id === targetId);

          const newSites = sourceFolder.sites.filter((s) => s.url !== movedSite.url);

          const newItems = [...prev];

          if (newSites.length === 0) {
            newItems.splice(sourceFolderIdx, 1);
          } else if (newSites.length === 1) {
            const singleItem: GridItemType = {
              id: `site-unfolded-${Date.now()}`,
              type: "site",
              shape: { cols: 1, rows: 1 },
              site: newSites[0],
            };
            newItems[sourceFolderIdx] = singleItem;
          } else {
            newItems[sourceFolderIdx] = { ...sourceFolder, sites: newSites };
          }

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
