import type { GridItemType } from "../desktopGridTypes";
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
