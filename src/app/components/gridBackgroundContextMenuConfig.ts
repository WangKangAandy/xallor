import type { GridContextMenuEntry } from "./gridItemContextMenuConfig";

/**
 * 网格空白区域右键菜单：提供整理模式与背景下载入口。
 */
export function getGridBackgroundContextMenuEntries(
  onEnterArrangeMode?: () => void,
  onDownloadWallpaper?: () => void,
  isDownloadingWallpaper = false,
): GridContextMenuEntry[] {
  const entries: GridContextMenuEntry[] = [];
  if (onDownloadWallpaper) {
    entries.push({
      id: "download-wallpaper",
      label: isDownloadingWallpaper ? "下载中..." : "下载壁纸",
      onSelect: () => {
        if (isDownloadingWallpaper) return;
        onDownloadWallpaper();
      },
    });
  }
  if (onEnterArrangeMode) {
    entries.push({
      id: "arrange-mode",
      label: "整理模式",
      onSelect: onEnterArrangeMode,
    });
  }
  return entries;
}

