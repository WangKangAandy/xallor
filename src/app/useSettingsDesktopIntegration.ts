import { useCallback, useState } from "react";
import type { LayoutMode } from "./preferences";
import type { SiteItem } from "./components/desktopGridTypes";
import type { AddIconSubmitPayload } from "./components/addIcon";
import type { HiddenSpaceSettingsBinding } from "./hiddenSpace/hiddenSpaceSettingsBinding";
import type { AppSettingsInitialSection } from "./useSettingsModalController";
import { useSettingsSpotlightBindings } from "./useSettingsSpotlightBindings";

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
  const [restoreItems, setRestoreItems] = useState<SiteItem[]>([]);
  const [pendingAddPayloads, setPendingAddPayloads] = useState<AddIconSubmitPayload[]>([]);

  const { settingsState, settingsActions } = useSettingsSpotlightBindings({
    isSettingsOpen,
    settingsInitialSection,
    closeSettings,
    layoutMode,
    setLayoutMode,
    openLinksInNewTab,
    setOpenLinksInNewTab,
    hiddenSpace,
    setRestoreQueue: setRestoreItems,
    setSettingsAddQueue: setPendingAddPayloads,
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

  return {
    settingsState,
    settingsActions,
    restoreItems,
    pendingAddPayloads,
    onAddPayloadsConsumed,
    onRestoreApplied,
  };
}
