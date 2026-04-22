import { useCallback, useState } from "react";
import {
  DEFAULT_NEW_TAB_BACKGROUND_URL,
  downloadWallpaper,
  getCurrentWallpaperSource,
  type DownloadWallpaperResult,
} from "./components/feedback";
import { ENTER_ARRANGE_FROM_BACKGROUND_EVENT } from "./components/contextMenuEvents";
import { useGridBackgroundContextMenu } from "./components/useGridBackgroundContextMenu";

type UseDesktopBackgroundActionsParams = {
  onOpenAddSiteOrComponent: () => void;
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

export function useDesktopBackgroundActions({ onOpenAddSiteOrComponent, onShowAlert }: UseDesktopBackgroundActionsParams) {
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

  const { onContextMenu: onDesktopBackgroundContextMenu, portal: desktopBackgroundMenuPortal } = useGridBackgroundContextMenu(
    () => {
      window.dispatchEvent(new Event(ENTER_ARRANGE_FROM_BACKGROUND_EVENT));
    },
    onOpenAddSiteOrComponent,
    handleDownloadWallpaper,
    isDownloadingWallpaper,
  );

  return {
    onDesktopBackgroundContextMenu,
    desktopBackgroundMenuPortal,
  };
}
