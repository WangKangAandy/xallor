import { useMemo } from "react";
import { getGridBackgroundContextMenuEntries } from "./gridBackgroundContextMenuConfig";
import { useGridContextMenu } from "./useGridContextMenu";

export function useGridBackgroundContextMenu(
  onEnterArrangeMode?: () => void,
  onDownloadWallpaper?: () => void,
  isDownloadingWallpaper = false,
) {
  const entries = useMemo(
    () => getGridBackgroundContextMenuEntries(onEnterArrangeMode, onDownloadWallpaper, isDownloadingWallpaper),
    [onEnterArrangeMode, onDownloadWallpaper, isDownloadingWallpaper],
  );
  return useGridContextMenu(entries);
}

