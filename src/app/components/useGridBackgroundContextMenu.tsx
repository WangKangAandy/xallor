import { useMemo } from "react";
import { getGridBackgroundContextMenuEntries } from "./gridBackgroundContextMenuConfig";
import { useGridContextMenu } from "./useGridContextMenu";
import { useAppI18n } from "../i18n/AppI18n";

export function useGridBackgroundContextMenu(
  onEnterArrangeMode?: () => void,
  onOpenAddSiteOrComponent?: () => void,
  onDownloadWallpaper?: () => void,
  isDownloadingWallpaper = false,
) {
  const { t } = useAppI18n();
  const entries = useMemo(
    () =>
      getGridBackgroundContextMenuEntries(
        onEnterArrangeMode,
        onOpenAddSiteOrComponent,
        onDownloadWallpaper,
        isDownloadingWallpaper,
        {
          addSiteOrComponent: t("contextMenu.addSiteOrComponent"),
          downloadWallpaper: t("contextMenu.downloadWallpaper"),
          downloadingWallpaper: t("contextMenu.downloadingWallpaper"),
          arrangeMode: t("contextMenu.arrangeMode"),
        },
      ),
    [onEnterArrangeMode, onOpenAddSiteOrComponent, onDownloadWallpaper, isDownloadingWallpaper, t],
  );
  return useGridContextMenu(entries);
}

