import type { GridDnDDragItem } from "../desktopGridDnDTypes";
import type { FolderItem, GridItemType } from "../desktopGridTypes";
import { removeGridItemById, removeSiteFromFolderByUrl } from "../desktopGridItemActions";
import { createFolderSiteArrangeId, parseFolderSiteArrangeId } from "./arrangeItemIds";

/**
 * 统一「网格项 -> 可选择 id 集合」映射，避免在组件内重复分支。
 */
export function getSelectableArrangeIdsFromGridItem(item: GridItemType): string[] {
  if (item.type !== "folder") {
    return [item.id];
  }
  return item.sites.map((site) => createFolderSiteArrangeId(item.id, site.url));
}

/**
 * 判断某组 id 在当前选择集中是否应执行“全选”（用于 folder 圆点切换）。
 */
export function shouldSelectAllIds(ids: string[], selectedIds: Set<string>): boolean {
  return !ids.every((id) => selectedIds.has(id));
}

/**
 * 按统一选择集删除目标：支持桌面项 id 与文件夹内部站点复合 id。
 */
export function deleteItemsByArrangeSelection(items: GridItemType[], selectedIds: Set<string>): GridItemType[] {
  let next = items;
  for (const id of selectedIds) {
    const folderTarget = parseFolderSiteArrangeId(id);
    if (folderTarget) {
      next = removeSiteFromFolderByUrl(next, folderTarget.folderId, folderTarget.siteUrl);
      continue;
    }
    next = removeGridItemById(next, id);
  }
  return next;
}

type MoveDraggedItemOptions = {
  inCenterZone?: boolean;
  shouldMerge: boolean;
  createIdSeed?: () => number;
  selectedIds?: Set<string>;
};

function createDefaultFolder(idSeed: number, sites: FolderItem["sites"]): FolderItem {
  return {
    id: `folder-${idSeed}`,
    type: "folder",
    shape: { cols: 2, rows: 1 },
    name: "新建文件夹",
    colorFrom: "rgba(147,197,253,0.75)",
    colorTo: "rgba(99,102,241,0.75)",
    sites,
  };
}

export function resolveBatchDragIds(items: GridItemType[], draggedId: string, selectedIds?: Set<string>): string[] {
  const existingIds = new Set(items.map((item) => item.id));
  if (!selectedIds?.has(draggedId)) return [draggedId];
  return Array.from(selectedIds).filter((id) => existingIds.has(id));
}

function moveTopLevelItemsToTarget(
  items: GridItemType[],
  movingIds: string[],
  targetId: string,
): GridItemType[] {
  const movingSet = new Set(movingIds);
  const movingItems = items.filter((item) => movingSet.has(item.id));
  const restItems = items.filter((item) => !movingSet.has(item.id));
  const targetIndex = targetId === "GRID_END" ? restItems.length : restItems.findIndex((item) => item.id === targetId);
  const insertAt = targetIndex >= 0 ? targetIndex : restItems.length;
  const next = [...restItems];
  next.splice(insertAt, 0, ...movingItems);
  return next;
}

function collectSelectedFolderSites(
  draggedItem: GridDnDDragItem,
  selectedIds?: Set<string>,
): { sourceFolderId: string; siteUrl: string }[] {
  if (!draggedItem.sourceFolderId || !draggedItem.site) return [];
  const draggedArrangeId = createFolderSiteArrangeId(draggedItem.sourceFolderId, draggedItem.site.url);
  if (!selectedIds?.has(draggedArrangeId)) {
    return [{ sourceFolderId: draggedItem.sourceFolderId, siteUrl: draggedItem.site.url }];
  }

  const selectedFolderSites: { sourceFolderId: string; siteUrl: string }[] = [];
  for (const id of selectedIds) {
    const parsed = parseFolderSiteArrangeId(id);
    if (!parsed) continue;
    selectedFolderSites.push({ sourceFolderId: parsed.folderId, siteUrl: parsed.siteUrl });
  }
  return selectedFolderSites.length > 0
    ? selectedFolderSites
    : [{ sourceFolderId: draggedItem.sourceFolderId, siteUrl: draggedItem.site.url }];
}

function removeAndCollectFolderSites(
  items: GridItemType[],
  targets: { sourceFolderId: string; siteUrl: string }[],
): { nextItems: GridItemType[]; movedSites: FolderItem["sites"] } {
  const folderSiteMap = new Map<string, Map<string, FolderItem["sites"][number]>>();
  for (const item of items) {
    if (item.type !== "folder") continue;
    const siteMap = new Map(item.sites.map((site) => [site.url, site]));
    folderSiteMap.set(item.id, siteMap);
  }

  const movedSites: FolderItem["sites"] = [];
  let nextItems = items;
  for (const target of targets) {
    const movedSite = folderSiteMap.get(target.sourceFolderId)?.get(target.siteUrl);
    if (!movedSite) continue;
    movedSites.push(movedSite);
    nextItems = removeSiteFromFolderByUrl(nextItems, target.sourceFolderId, target.siteUrl);
  }
  return { nextItems, movedSites };
}

/**
 * 统一 drop 后的移动命令：收敛 folder-site 与主网格 site 的落点/合并分支。
 */
export function moveSelectedByDrop(
  items: GridItemType[],
  draggedItem: GridDnDDragItem,
  targetId: string,
  options: MoveDraggedItemOptions,
): GridItemType[] {
  const createIdSeed = options.createIdSeed ?? Date.now;

  if (draggedItem.type === "folder-site" && draggedItem.site) {
    const selectedFolderSites = collectSelectedFolderSites(draggedItem, options.selectedIds);
    const { nextItems: removedFromSource, movedSites } = removeAndCollectFolderSites(items, selectedFolderSites);
    if (movedSites.length === 0) return items;
    const targetItem = removedFromSource.find((item) => item.id === targetId);

    if (targetItem && options.inCenterZone && targetItem.type === "folder") {
      return removedFromSource.map((item) =>
        item.id === targetItem.id && item.type === "folder" ? { ...item, sites: [...item.sites, ...movedSites] } : item,
      );
    }
    if (targetItem && options.inCenterZone && targetItem.type === "site") {
      const newFolder = createDefaultFolder(createIdSeed(), [targetItem.site, ...movedSites]);
      return removedFromSource.map((item) => (item.id === targetId ? newFolder : item));
    }

    const newSiteItems: GridItemType[] = movedSites.map((site) => ({
      id: `site-${createIdSeed()}`,
      type: "site",
      shape: { cols: 1, rows: 1 },
      site,
    }));
    const insertIdx = targetId === "GRID_END" ? removedFromSource.length : removedFromSource.findIndex((item) => item.id === targetId);
    const next = [...removedFromSource];
    next.splice(insertIdx >= 0 ? insertIdx : next.length, 0, ...newSiteItems);
    return next;
  }

  const movingIds = resolveBatchDragIds(items, draggedItem.id, options.selectedIds);
  if (movingIds.length === 0) return items;

  if (!options.shouldMerge || targetId === "GRID_END") {
    return moveTopLevelItemsToTarget(items, movingIds, targetId);
  }
  const target = items.find((item) => item.id === targetId);
  if (target?.type === "folder") {
    const movingSet = new Set(movingIds);
    const movingSites: FolderItem["sites"] = [];
    for (const item of items) {
      if (!movingSet.has(item.id) || item.type !== "site") continue;
      movingSites.push(item.site);
    }
    if (movingSites.length === 0) return items;
    return items
      .map((item) => (item.id === targetId && item.type === "folder" ? { ...item, sites: [...item.sites, ...movingSites] } : item))
      .filter((item) => !movingSet.has(item.id));
  }
  if (movingIds.length !== 1 || movingIds[0] === targetId) return items;

  const dragged = items.find((item) => item.id === movingIds[0]);
  if (!dragged || !target || dragged.type !== "site") return items;

  if (target.type === "site") {
    const newFolder = createDefaultFolder(createIdSeed(), [target.site, dragged.site]);
    return items.flatMap((item) => {
      if (item.id === dragged.id) return [];
      if (item.id === targetId) return [newFolder];
      return [item];
    });
  }
  return items;
}

/**
 * 向后兼容：单项 drop 入口仍可复用 moveSelectedByDrop。
 */
export function moveDraggedItemByDrop(
  items: GridItemType[],
  draggedItem: GridDnDDragItem,
  targetId: string,
  options: MoveDraggedItemOptions,
): GridItemType[] {
  return moveSelectedByDrop(items, draggedItem, targetId, options);
}
