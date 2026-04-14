import type { FolderItem, GridItemType, SiteItem } from "./desktopGridTypes";

/** 从桌面列表中移除指定 id 的项（右键删除等）。 */
export function removeGridItemById(items: GridItemType[], id: string): GridItemType[] {
  return items.filter((item) => item.id !== id);
}

/**
 * 将文件夹规范化为合法桌面项：2+ 保持文件夹，1 退化为站点，0 删除。
 */
export function normalizeFolderAsGridItems(folder: FolderItem): GridItemType[] {
  if (folder.sites.length >= 2) {
    return [folder];
  }
  if (folder.sites.length === 1) {
    const singleSite: SiteItem = {
      id: `site-from-${folder.id}`,
      type: "site",
      shape: { cols: 1, rows: 1 },
      site: folder.sites[0],
    };
    return [singleSite];
  }
  return [];
}

/**
 * 从指定文件夹中移除站点，并按「文件夹至少 2 项」规则自动收敛。
 */
export function removeSiteFromFolderByUrl(items: GridItemType[], folderId: string, siteUrl: string): GridItemType[] {
  return items.flatMap((item) => {
    if (item.type !== "folder" || item.id !== folderId) return [item];
    const nextFolder: FolderItem = {
      ...item,
      sites: item.sites.filter((site) => site.url !== siteUrl),
    };
    return normalizeFolderAsGridItems(nextFolder);
  });
}
