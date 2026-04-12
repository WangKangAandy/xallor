import type { GridItemType } from "./desktopGridTypes";

/** 从桌面列表中移除指定 id 的项（右键删除等）。 */
export function removeGridItemById(items: GridItemType[], id: string): GridItemType[] {
  return items.filter((item) => item.id !== id);
}
