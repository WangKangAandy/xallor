import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import type { LayoutMode } from "./preferences";
import { isMinimalDockEnabled, useUiPreferences } from "./preferences";
import type { GridItemType, SiteItem } from "./components/desktopGridTypes";
import { ENTER_ARRANGE_FROM_BACKGROUND_EVENT } from "./components/contextMenuEvents";
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
import type { MinimalDockEntry, MinimalDockSiteEntry } from "./minimalDock";

type UseSettingsDesktopIntegrationParams = {
  isSettingsOpen: boolean;
  settingsInitialSection: AppSettingsInitialSection;
  closeSettings: () => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  openLinksInNewTab: boolean;
  setOpenLinksInNewTab: (value: boolean) => void;
  hiddenSpace: HiddenSpaceSettingsBinding;
  onRequestHideGridItem: (item: GridItemType) => Promise<boolean>;
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
  onRequestHideGridItem,
}: UseSettingsDesktopIntegrationParams) {
  const { minimalDockMode } = useUiPreferences();
  const [restoreItems, setRestoreItems] = useState<SiteItem[]>([]);
  const [pendingAddPayloads, setPendingAddPayloads] = useState<AddIconSubmitPayload[]>([]);
  const [minimalDockEntries, setMinimalDockEntries] = useState<MinimalDockEntry[]>(() => readMinimalDockFromStorage());
  const [dockFullPulseSeq, setDockFullPulseSeq] = useState(0);

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
          if (r.appendedSiteEntryIds.length === 0 && r.remaining.length > 0) {
            // Dock 已满时触发一次轻呼吸反馈，告知点击已被接收但未能继续添加。
            setDockFullPulseSeq((seq) => seq + 1);
          }
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

  const onMinimalDockDeleteSiteEntry = useCallback((dockEntryId: string) => {
    setMinimalDockEntries((prev) => prev.filter((e) => e.id !== dockEntryId));
  }, []);

  const onMinimalDockHideSiteEntry = useCallback(
    async (dockEntryId: string) => {
      const entry = minimalDockEntries.find((e): e is MinimalDockSiteEntry => e.kind === "site" && e.id === dockEntryId);
      if (!entry) return;
      const siteItem: SiteItem = {
        id: entry.id,
        type: "site",
        shape: { cols: 1, rows: 1 },
        site: { ...entry.site },
      };
      const accepted = await onRequestHideGridItem(siteItem);
      if (!accepted) return;
      setMinimalDockEntries((prev) => prev.filter((e) => e.id !== dockEntryId));
    },
    [minimalDockEntries, onRequestHideGridItem],
  );

  const onMinimalDockEnterArrangeMode = useCallback(() => {
    setLayoutMode("default");
    window.setTimeout(() => {
      window.dispatchEvent(new Event(ENTER_ARRANGE_FROM_BACKGROUND_EVENT));
    }, 200);
  }, [setLayoutMode]);

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
    onMinimalDockDeleteSiteEntry,
    onMinimalDockHideSiteEntry,
    onMinimalDockEnterArrangeMode,
    dockFullPulseSeq,
  };
}
