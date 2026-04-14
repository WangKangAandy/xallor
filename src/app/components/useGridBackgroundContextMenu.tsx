import { useMemo } from "react";
import { getGridBackgroundContextMenuEntries } from "./gridBackgroundContextMenuConfig";
import { useGridContextMenu } from "./useGridContextMenu";

export function useGridBackgroundContextMenu(onEnterArrangeMode?: () => void) {
  const entries = useMemo(() => getGridBackgroundContextMenuEntries(onEnterArrangeMode), [onEnterArrangeMode]);
  return useGridContextMenu(entries);
}

