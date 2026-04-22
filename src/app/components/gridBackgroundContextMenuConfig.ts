import type { GridContextMenuEntry } from "./gridItemContextMenuConfig";

export type GridBackgroundContextMenuLabels = {
  addSiteOrComponent: string;
  downloadWallpaper: string;
  switchWallpaper: string;
  downloadingWallpaper: string;
  arrangeMode: string;
};

/**
 * 网格空白区域右键菜单：提供整理模式与背景下载入口。
 */
export function getGridBackgroundContextMenuEntries(
  onEnterArrangeMode?: () => void,
  onOpenAddSiteOrComponent?: () => void,
  onDownloadWallpaper?: () => void,
  onSwitchWallpaper?: () => void,
  isDownloadingWallpaper = false,
  labels?: GridBackgroundContextMenuLabels,
): GridContextMenuEntry[] {
  const text = labels ?? {
    addSiteOrComponent: "添加站点 & 组件",
    downloadWallpaper: "下载壁纸",
    switchWallpaper: "更换壁纸",
    downloadingWallpaper: "下载中...",
    arrangeMode: "整理模式",
  };
  const entries: GridContextMenuEntry[] = [];
  if (onOpenAddSiteOrComponent) {
    entries.push({
      id: "add-site-or-component",
      label: text.addSiteOrComponent,
      onSelect: onOpenAddSiteOrComponent,
    });
  }
  if (onDownloadWallpaper) {
    entries.push({
      id: "download-wallpaper",
      label: isDownloadingWallpaper ? text.downloadingWallpaper : text.downloadWallpaper,
      onSelect: () => {
        if (isDownloadingWallpaper) return;
        onDownloadWallpaper();
      },
    });
  }
  if (onSwitchWallpaper) {
    entries.push({
      id: "switch-wallpaper",
      label: text.switchWallpaper,
      onSelect: onSwitchWallpaper,
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

