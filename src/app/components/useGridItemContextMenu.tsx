import { useMemo } from "react";
import { getGridItemContextMenuEntries } from "./gridItemContextMenuConfig";
import { useGridContextMenu } from "./useGridContextMenu";

/**
 * 网格卡片右键菜单：打开/关闭、全局点外部关闭；菜单内容由配置生成。
 */
export function useGridItemContextMenu(
  itemId: string,
  onDeleteItem?: (id: string) => void,
  onHideItem?: (id: string) => void,
  onEnterArrangeMode?: () => void,
) {
  const entries = useMemo(
    () => getGridItemContextMenuEntries(itemId, onDeleteItem, onEnterArrangeMode, onHideItem),
    [itemId, onDeleteItem, onHideItem, onEnterArrangeMode],
  );
  return useGridContextMenu(entries);
}
