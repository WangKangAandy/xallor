import { useCallback } from "react";
import type { HiddenCandidate } from "./hiddenSpace/useHiddenSpace";
import type { GridItemType } from "./components/desktopGridTypes";

type HideItemRequestDeps = {
  isHiddenSpaceEnabled: boolean;
  isFolderWarned: boolean;
  showEnableHint: () => void;
  requestFolderConfirm: () => Promise<boolean>;
  markFolderWarned: () => void;
  hideCandidates: (candidates: HiddenCandidate[]) => void;
};

export async function requestHideGridItem(item: GridItemType, deps: HideItemRequestDeps): Promise<boolean> {
  if (!deps.isHiddenSpaceEnabled) {
    deps.showEnableHint();
    return false;
  }
  if (item.type === "widget") return false;
  if (item.type === "folder" && !deps.isFolderWarned) {
    const ok = await deps.requestFolderConfirm();
    if (!ok) return false;
    deps.markFolderWarned();
  }
  if (item.type === "site") {
    deps.hideCandidates([{ type: "site", item }]);
  } else {
    deps.hideCandidates([{ type: "folder", item }]);
  }
  return true;
}

export function useHideItemRequest(deps: HideItemRequestDeps) {
  return useCallback(async (item: GridItemType) => await requestHideGridItem(item, deps), [deps]);
}
