import { useCallback, useMemo, useState } from "react";
import {
  DEFAULT_NEW_TAB_BACKGROUND_URL,
  downloadWallpaper,
  getCurrentWallpaperSource,
  type DownloadWallpaperResult,
} from "./components/feedback";
import { ENTER_ARRANGE_FROM_BACKGROUND_EVENT } from "./components/contextMenuEvents";
import { useGridContextMenu } from "./components/useGridContextMenu";
import { buildDesktopBackgroundMenuEntries } from "./components/desktopBackgroundMenuModel";
import type { LayoutMode } from "./preferences";
import { useAppI18n } from "./i18n/AppI18n";

type UseDesktopBackgroundActionsParams = {
  layoutMode: LayoutMode;
  onOpenAddSiteOrComponent: () => void;
  onOpenWallpaperSettings: () => void;
  onShowAlert: (message: string) => void;
};

export function getWallpaperDownloadAlertMessage(result: DownloadWallpaperResult): string {
  if (result.ok && result.mode === "download") {
    return "壁纸已开始下载";
  }
  if (result.ok && result.mode === "fallback-opened") {
    return "自动下载失败，已打开原图，可手动保存";
  }
  if (!result.ok && result.reason === "popup-blocked") {
    return "自动下载失败，浏览器拦截了新窗口，请允许弹窗后重试";
  }
  if (!result.ok && result.reason === "invalid-url") {
    return "背景地址无效，无法下载";
  }
  return "下载失败，请稍后重试";
}

export function useDesktopBackgroundActions({
  layoutMode,
  onOpenAddSiteOrComponent,
  onOpenWallpaperSettings,
  onShowAlert,
}: UseDesktopBackgroundActionsParams) {
  const { t } = useAppI18n();
  const [isDownloadingWallpaper, setIsDownloadingWallpaper] = useState(false);

  const handleDownloadWallpaper = useCallback(async () => {
    if (isDownloadingWallpaper) return;
    setIsDownloadingWallpaper(true);
    try {
      const source =
        getCurrentWallpaperSource() ?? {
          kind: "unknown" as const,
          url: DEFAULT_NEW_TAB_BACKGROUND_URL,
        };
      const result = await downloadWallpaper(source);
      onShowAlert(getWallpaperDownloadAlertMessage(result));
    } finally {
      setIsDownloadingWallpaper(false);
    }
  }, [isDownloadingWallpaper, onShowAlert]);

  const entries = useMemo(
    () =>
      buildDesktopBackgroundMenuEntries({
        layoutMode,
        onEnterArrangeMode: () => {
          window.dispatchEvent(new Event(ENTER_ARRANGE_FROM_BACKGROUND_EVENT));
        },
        onOpenAddSiteOrComponent,
        onDownloadWallpaper: handleDownloadWallpaper,
        onSwitchWallpaper: onOpenWallpaperSettings,
        isDownloadingWallpaper,
        labels: {
          addSiteOrComponent: t("contextMenu.addSiteOrComponent"),
          downloadWallpaper: t("contextMenu.downloadWallpaper"),
          switchWallpaper: t("contextMenu.switchWallpaper"),
          downloadingWallpaper: t("contextMenu.downloadingWallpaper"),
          arrangeMode: t("contextMenu.arrangeMode"),
        },
      }),
    [layoutMode, onOpenAddSiteOrComponent, handleDownloadWallpaper, onOpenWallpaperSettings, isDownloadingWallpaper, t],
  );
  const { onContextMenu: onDesktopBackgroundContextMenu, portal: desktopBackgroundMenuPortal } = useGridContextMenu(entries);

  return {
    onDesktopBackgroundContextMenu,
    desktopBackgroundMenuPortal,
  };
}
