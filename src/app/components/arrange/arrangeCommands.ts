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
};

/**
 * 统一 drop 后的移动命令：收敛 folder-site 与主网格 site 的落点/合并分支。
 */
export function moveDraggedItemByDrop(
  items: GridItemType[],
  draggedItem: GridDnDDragItem,
  targetId: string,
  options: MoveDraggedItemOptions,
): GridItemType[] {
  const createIdSeed = options.createIdSeed ?? Date.now;

  if (draggedItem.type === "folder-site" && draggedItem.site) {
    if (!draggedItem.sourceFolderId) return items;
    const sourceFolderExists = items.some((item) => item.id === draggedItem.sourceFolderId);
    if (!sourceFolderExists) return items;

    const movedSite = draggedItem.site;
    const removedFromSource = removeSiteFromFolderByUrl(items, draggedItem.sourceFolderId, movedSite.url);
    const targetItem = removedFromSource.find((item) => item.id === targetId);

    if (targetItem && options.inCenterZone && targetItem.type === "folder") {
      return removedFromSource.map((item) =>
        item.id === targetItem.id && item.type === "folder"
          ? { ...item, sites: [...item.sites, movedSite] }
          : item,
      );
    }
    if (targetItem && options.inCenterZone && targetItem.type === "site") {
      const newFolder: FolderItem = {
        id: `folder-${createIdSeed()}`,
        type: "folder",
        shape: { cols: 2, rows: 1 },
        name: "新建文件夹",
        colorFrom: "rgba(147,197,253,0.75)",
        colorTo: "rgba(99,102,241,0.75)",
        sites: [targetItem.site, movedSite],
      };
      return removedFromSource.map((item) => (item.id === targetId ? newFolder : item));
    }

    const newSiteItem: GridItemType = {
      id: `site-${createIdSeed()}`,
      type: "site",
      shape: { cols: 1, rows: 1 },
      site: movedSite,
    };
    const insertIdx = removedFromSource.findIndex((item) => item.id === targetId);
    const next = [...removedFromSource];
    next.splice(insertIdx >= 0 ? insertIdx : next.length, 0, newSiteItem);
    return next;
  }

  if (!options.shouldMerge || draggedItem.id === targetId) return items;

  const dragged = items.find((item) => item.id === draggedItem.id);
  const target = items.find((item) => item.id === targetId);
  if (!dragged || !target || dragged.type !== "site") return items;

  if (target.type === "site") {
    const newFolder: FolderItem = {
      id: `folder-${createIdSeed()}`,
      type: "folder",
      shape: { cols: 2, rows: 1 },
      name: "新建文件夹",
      colorFrom: "rgba(147,197,253,0.75)",
      colorTo: "rgba(99,102,241,0.75)",
      sites: [target.site, dragged.site],
    };
    return items.flatMap((item) => {
      if (item.id === draggedItem.id) return [];
      if (item.id === targetId) return [newFolder];
      return [item];
    });
  }
  if (target.type === "folder") {
    return items
      .map((item) => (item.id === targetId && item.type === "folder" ? { ...item, sites: [...item.sites, dragged.site] } : item))
      .filter((item) => item.id !== draggedItem.id);
  }
  return items;
}
