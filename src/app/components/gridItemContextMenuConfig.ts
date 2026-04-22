/**
 * 网格项右键菜单项定义（数据驱动）。
 * 新增菜单项时优先改 {@link getGridItemContextMenuEntries}，避免在 Portal 组件内堆 JSX。
 */
export type GridContextMenuEntry = {
  id: string;
  label: string;
  /** 点击后执行；关闭菜单由调用方在选中后统一处理。 */
  onSelect: () => void;
};

export type GridItemContextMenuLabels = {
  openCurrentWindow: string;
  openNewWindow: string;
  hide: string;
  remove: string;
  arrangeMode: string;
};

export function getGridItemContextMenuEntries(
  itemId: string,
  onDeleteItem?: (id: string) => void,
  onEnterArrangeMode?: () => void,
  onHideItem?: (id: string) => void,
  onOpenInCurrentWindow?: () => void,
  onOpenInNewWindow?: () => void,
  labels?: GridItemContextMenuLabels,
): GridContextMenuEntry[] {
  const text = labels ?? {
    openCurrentWindow: "当前窗口打开",
    openNewWindow: "新窗口打开",
    hide: "隐藏",
    remove: "删除图标",
    arrangeMode: "整理模式",
  };
  const entries: GridContextMenuEntry[] = [];
  if (onOpenInCurrentWindow) {
    entries.push({
      id: "open-current-window",
      label: text.openCurrentWindow,
      onSelect: onOpenInCurrentWindow,
    });
  }
  if (onOpenInNewWindow) {
    entries.push({
      id: "open-new-window",
      label: text.openNewWindow,
      onSelect: onOpenInNewWindow,
    });
  }
  if (onHideItem) {
    entries.push({
      id: "hide",
      label: text.hide,
      onSelect: () => onHideItem(itemId),
    });
  }
  if (onDeleteItem) {
    entries.push({
      id: "remove",
      label: text.remove,
      onSelect: () => onDeleteItem(itemId),
    });
  }
  if (onEnterArrangeMode) {
    entries.push({
      id: "arrange-mode",
      label: text.arrangeMode,
      onSelect: onEnterArrangeMode,
    });
  }
  return entries;
}
