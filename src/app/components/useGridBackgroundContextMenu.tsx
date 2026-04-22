import { useMemo } from "react";
import { getGridBackgroundContextMenuEntries } from "./gridBackgroundContextMenuConfig";
import { useGridContextMenu } from "./useGridContextMenu";
import { useAppI18n } from "../i18n/AppI18n";

export function useGridBackgroundContextMenu(
  onEnterArrangeMode?: () => void,
  onOpenAddSiteOrComponent?: () => void,
  onDownloadWallpaper?: () => void,
  onSwitchWallpaper?: () => void,
  isDownloadingWallpaper = false,
) {
  const { t } = useAppI18n();
  const entries = useMemo(
    () =>
      getGridBackgroundContextMenuEntries(
        onEnterArrangeMode,
        onOpenAddSiteOrComponent,
        onDownloadWallpaper,
        onSwitchWallpaper,
        isDownloadingWallpaper,
        {
          addSiteOrComponent: t("contextMenu.addSiteOrComponent"),
          downloadWallpaper: t("contextMenu.downloadWallpaper"),
          switchWallpaper: t("contextMenu.switchWallpaper"),
          downloadingWallpaper: t("contextMenu.downloadingWallpaper"),
          arrangeMode: t("contextMenu.arrangeMode"),
        },
      ),
    [onEnterArrangeMode, onOpenAddSiteOrComponent, onDownloadWallpaper, onSwitchWallpaper, isDownloadingWallpaper, t],
  );
  return useGridContextMenu(entries);
}

