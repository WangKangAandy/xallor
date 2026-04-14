import type { GridContextMenuEntry } from "./gridItemContextMenuConfig";

/**
 * 网格空白区域右键菜单：仅提供“整理模式”入口，不展示“删除图标”。
 */
export function getGridBackgroundContextMenuEntries(onEnterArrangeMode?: () => void): GridContextMenuEntry[] {
  if (!onEnterArrangeMode) return [];
  return [
    {
      id: "arrange-mode",
      label: "整理模式",
      onSelect: onEnterArrangeMode,
    },
  ];
}

