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

export function getGridItemContextMenuEntries(
  itemId: string,
  onDeleteItem?: (id: string) => void,
): GridContextMenuEntry[] {
  if (!onDeleteItem) return [];
  return [
    {
      id: "remove",
      label: "删除图标",
      onSelect: () => onDeleteItem(itemId),
    },
  ];
}
