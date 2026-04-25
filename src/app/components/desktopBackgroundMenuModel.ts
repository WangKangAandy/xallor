import type { LayoutMode } from "../preferences";
import type { GridContextMenuEntry } from "./gridItemContextMenuConfig";

export type DesktopBackgroundMenuLabels = {
  addSiteOrComponent: string;
  downloadWallpaper: string;
  switchWallpaper: string;
  downloadingWallpaper: string;
  arrangeMode: string;
};

type BuildDesktopBackgroundMenuEntriesParams = {
  layoutMode: LayoutMode;
  onEnterArrangeMode?: () => void;
  onOpenAddSiteOrComponent?: () => void;
  onDownloadWallpaper?: () => void;
  onSwitchWallpaper?: () => void;
  isDownloadingWallpaper?: boolean;
  labels: DesktopBackgroundMenuLabels;
};

/**
 * 桌面背景右键菜单模型：不同布局拥有各自菜单策略，而非在同一菜单中做补丁隐藏。
 * - default：完整桌面管理菜单
 * - minimal：仅保留与极简场景一致的背景管理入口
 */
export function buildDesktopBackgroundMenuEntries({
  layoutMode,
  onEnterArrangeMode,
  onOpenAddSiteOrComponent,
  onDownloadWallpaper,
  onSwitchWallpaper,
  isDownloadingWallpaper = false,
  labels,
}: BuildDesktopBackgroundMenuEntriesParams): GridContextMenuEntry[] {
  const entries: GridContextMenuEntry[] = [];

  if (onDownloadWallpaper) {
    entries.push({
      id: "download-wallpaper",
      label: isDownloadingWallpaper ? labels.downloadingWallpaper : labels.downloadWallpaper,
      onSelect: () => {
        if (isDownloadingWallpaper) return;
        onDownloadWallpaper();
      },
    });
  }
  if (onSwitchWallpaper) {
    entries.push({
      id: "switch-wallpaper",
      label: labels.switchWallpaper,
      onSelect: onSwitchWallpaper,
    });
  }

  if (layoutMode === "default") {
    if (onOpenAddSiteOrComponent) {
      entries.push({
        id: "add-site-or-component",
        label: labels.addSiteOrComponent,
        onSelect: onOpenAddSiteOrComponent,
      });
    }
    if (onEnterArrangeMode) {
      entries.push({
        id: "arrange-mode",
        label: labels.arrangeMode,
        onSelect: onEnterArrangeMode,
      });
    }
  }

  return entries;
}
