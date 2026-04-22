import { useMemo } from "react";
import { getGridItemContextMenuEntries } from "./gridItemContextMenuConfig";
import { useGridContextMenu } from "./useGridContextMenu";
import { useAppI18n } from "../i18n/AppI18n";

/**
 * 网格卡片右键菜单：打开/关闭、全局点外部关闭；菜单内容由配置生成。
 */
export function useGridItemContextMenu(
  itemId: string,
  onDeleteItem?: (id: string) => void,
  onHideItem?: (id: string) => void,
  onEnterArrangeMode?: () => void,
  onOpenInCurrentWindow?: () => void,
  onOpenInNewWindow?: () => void,
) {
  const { t } = useAppI18n();
  const entries = useMemo(
    () =>
      getGridItemContextMenuEntries(
        itemId,
        onDeleteItem,
        onEnterArrangeMode,
        onHideItem,
        onOpenInCurrentWindow,
        onOpenInNewWindow,
        {
          openCurrentWindow: t("contextMenu.openCurrentWindow"),
          openNewWindow: t("contextMenu.openNewWindow"),
          hide: t("contextMenu.hide"),
          remove: t("contextMenu.deleteIcon"),
          arrangeMode: t("contextMenu.arrangeMode"),
        },
      ),
    [itemId, onDeleteItem, onHideItem, onEnterArrangeMode, onOpenInCurrentWindow, onOpenInNewWindow, t],
  );
  return useGridContextMenu(entries);
}
