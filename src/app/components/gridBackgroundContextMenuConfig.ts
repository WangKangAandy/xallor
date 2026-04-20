import type { GridContextMenuEntry } from "./gridItemContextMenuConfig";

export type GridBackgroundContextMenuLabels = {
  downloadWallpaper: string;
  downloadingWallpaper: string;
  arrangeMode: string;
};

/**
 * 网格空白区域右键菜单：提供整理模式与背景下载入口。
 */
export function getGridBackgroundContextMenuEntries(
  onEnterArrangeMode?: () => void,
  onDownloadWallpaper?: () => void,
  isDownloadingWallpaper = false,
  labels?: GridBackgroundContextMenuLabels,
): GridContextMenuEntry[] {
  const text = labels ?? {
    downloadWallpaper: "下载壁纸",
    downloadingWallpaper: "下载中...",
    arrangeMode: "整理模式",
  };
  const entries: GridContextMenuEntry[] = [];
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
  if (onEnterArrangeMode) {
    entries.push({
      id: "arrange-mode",
      label: text.arrangeMode,
      onSelect: onEnterArrangeMode,
    });
  }
  return entries;
}

