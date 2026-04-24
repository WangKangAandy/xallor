import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import type { LayoutMode } from "./preferences";
import { isMinimalDockEnabled, useUiPreferences } from "./preferences";
import type { SiteItem } from "./components/desktopGridTypes";
import type { AddIconSubmitPayload } from "./components/addIcon";
import type { HiddenSpaceSettingsBinding } from "./hiddenSpace/hiddenSpaceSettingsBinding";
import type { AppSettingsInitialSection } from "./useSettingsModalController";
import { useSettingsSpotlightBindings } from "./useSettingsSpotlightBindings";
import { createGridItemFromAddPayload } from "./components/widgets/createGridItemFromAddPayload";
import {
  appendSiteItemsToMinimalDockEntries,
  appendToPendingDockRestoreQueue,
  readMinimalDockFromStorage,
  readPendingDockRestoreQueue,
  reorderMinimalDockEntries,
  writeMinimalDockToStorage,
  writePendingDockRestoreQueue,
} from "./minimalDock";
import type { MinimalDockEntry } from "./minimalDock";

type UseSettingsDesktopIntegrationParams = {
  isSettingsOpen: boolean;
  settingsInitialSection: AppSettingsInitialSection;
  closeSettings: () => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  openLinksInNewTab: boolean;
  setOpenLinksInNewTab: (value: boolean) => void;
  hiddenSpace: HiddenSpaceSettingsBinding;
};

export function useSettingsDesktopIntegration({
  isSettingsOpen,
  settingsInitialSection,
  closeSettings,
  layoutMode,
  setLayoutMode,
  openLinksInNewTab,
  setOpenLinksInNewTab,
  hiddenSpace,
}: UseSettingsDesktopIntegrationParams) {
  const { minimalDockMode } = useUiPreferences();
  const [restoreItems, setRestoreItems] = useState<SiteItem[]>([]);
  const [pendingAddPayloads, setPendingAddPayloads] = useState<AddIconSubmitPayload[]>([]);
  const [minimalDockEntries, setMinimalDockEntries] = useState<MinimalDockEntry[]>(() => readMinimalDockFromStorage());

  useEffect(() => {
    writeMinimalDockToStorage(minimalDockEntries);
  }, [minimalDockEntries]);

  const onRestoreHiddenItems = useCallback(
    (items: SiteItem[]) => {
      if (layoutMode === "default") {
        setRestoreItems(items);
        return;
      }
      if (!isMinimalDockEnabled(minimalDockMode)) {
        appendToPendingDockRestoreQueue(items);
        return;
      }
      setMinimalDockEntries((prev) => {
        const r = appendSiteItemsToMinimalDockEntries(prev, items);
        if (r.appendedSiteEntryIds.length > 0) {
          hiddenSpace.removeHiddenItemsByIds(r.appendedSiteEntryIds);
        }
        return r.nextEntries;
      });
    },
    [layoutMode, minimalDockMode, hiddenSpace],
  );

  const onAddItemFromSettings = useCallback(
    (payload: AddIconSubmitPayload) => {
      if (layoutMode === "minimal") {
        if (payload.kind === "component" || !isMinimalDockEnabled(minimalDockMode)) return;
        const created = createGridItemFromAddPayload(payload);
        if (created.type !== "site") return;
        setMinimalDockEntries((prev) => {
          const r = appendSiteItemsToMinimalDockEntries(prev, [created]);
          return r.nextEntries;
        });
        return;
      }
      setPendingAddPayloads((prev) => [...prev, payload]);
    },
    [layoutMode, minimalDockMode],
  );

  const { settingsState, settingsActions } = useSettingsSpotlightBindings({
    isSettingsOpen,
    settingsInitialSection,
    closeSettings,
    layoutMode,
    setLayoutMode,
    openLinksInNewTab,
    setOpenLinksInNewTab,
    hiddenSpace,
    minimalDockMode,
    onRestoreHiddenItems,
    onAddItemFromSettings,
  });

  const onAddPayloadsConsumed = useCallback(() => {
    setPendingAddPayloads([]);
  }, []);

  const onRestoreApplied = useCallback(
    (ids: string[]) => {
      hiddenSpace.removeHiddenItemsByIds(ids);
      setRestoreItems([]);
    },
    [hiddenSpace],
  );

  const onMinimalDockReorder = useCallback((fromIndex: number, toIndex: number) => {
    setMinimalDockEntries((prev) => reorderMinimalDockEntries(prev, fromIndex, toIndex));
  }, []);

  useLayoutEffect(() => {
    if (layoutMode !== "minimal" || !isMinimalDockEnabled(minimalDockMode)) return;
    const queued = readPendingDockRestoreQueue();
    if (queued.length === 0) return;
    setMinimalDockEntries((prev) => {
      const r = appendSiteItemsToMinimalDockEntries(prev, queued);
      writePendingDockRestoreQueue(r.remaining);
      if (r.appendedSiteEntryIds.length > 0) {
        hiddenSpace.removeHiddenItemsByIds(r.appendedSiteEntryIds);
      }
      return r.nextEntries;
    });
  }, [layoutMode, minimalDockMode, hiddenSpace]);

  return {
    settingsState,
    settingsActions,
    restoreItems,
    pendingAddPayloads,
    onAddPayloadsConsumed,
    onRestoreApplied,
    minimalDockEntries,
    onMinimalDockReorder,
  };
}
