import { useMemo } from "react";
import { getGridBackgroundContextMenuEntries } from "./gridBackgroundContextMenuConfig";
import { useGridContextMenu } from "./useGridContextMenu";
import { useAppI18n } from "../i18n/AppI18n";

export function useGridBackgroundContextMenu(
  onEnterArrangeMode?: () => void,
  onDownloadWallpaper?: () => void,
  isDownloadingWallpaper = false,
) {
  const { t } = useAppI18n();
  const entries = useMemo(
    () =>
      getGridBackgroundContextMenuEntries(onEnterArrangeMode, onDownloadWallpaper, isDownloadingWallpaper, {
        downloadWallpaper: t("contextMenu.downloadWallpaper"),
        downloadingWallpaper: t("contextMenu.downloadingWallpaper"),
        arrangeMode: t("contextMenu.arrangeMode"),
      }),
    [onEnterArrangeMode, onDownloadWallpaper, isDownloadingWallpaper, t],
  );
  return useGridContextMenu(entries);
}

