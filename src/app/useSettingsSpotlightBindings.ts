import { useCallback, useMemo } from "react";
import type { LayoutMode, MinimalDockMode } from "./preferences";
import type { SiteItem } from "./components/desktopGridTypes";
import type { AddIconSubmitPayload } from "./components/addIcon";
import type { HiddenSpaceSettingsBinding } from "./hiddenSpace/hiddenSpaceSettingsBinding";
import type { AppSettingsInitialSection } from "./useSettingsModalController";

type UseSettingsSpotlightBindingsParams = {
  isSettingsOpen: boolean;
  settingsInitialSection: AppSettingsInitialSection;
  closeSettings: () => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  openLinksInNewTab: boolean;
  setOpenLinksInNewTab: (value: boolean) => void;
  hiddenSpace: HiddenSpaceSettingsBinding;
  minimalDockMode: MinimalDockMode;
  onRestoreHiddenItems: (items: SiteItem[]) => void;
  onAddItemFromSettings: (payload: AddIconSubmitPayload) => void;
};

export function useSettingsSpotlightBindings({
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
}: UseSettingsSpotlightBindingsParams) {
  const onDisableHiddenSpace = useCallback(
    async (password: string) => {
      const ok = await hiddenSpace.verifyPassword(password);
      if (!ok) return false;
      hiddenSpace.clearAllAndDisable();
      return true;
    },
    [hiddenSpace],
  );

  const settingsState = useMemo(
    () => ({
      open: isSettingsOpen,
      initialSection: settingsInitialSection,
      layoutMode,
      openLinksInNewTab,
      hiddenSpaceEnabled: hiddenSpace.isEnabled,
      hiddenItems: hiddenSpace.hiddenItems,
      isMinimalMode: layoutMode === "minimal",
      minimalDockMode,
      folderHintResetVisible: hiddenSpace.isDev,
    }),
    [
      hiddenSpace.hiddenItems,
      hiddenSpace.isDev,
      hiddenSpace.isEnabled,
      isSettingsOpen,
      layoutMode,
      minimalDockMode,
      openLinksInNewTab,
      settingsInitialSection,
    ],
  );

  const settingsActions = useMemo(
    () => ({
      onClose: closeSettings,
      onLayoutModeChange: setLayoutMode,
      onOpenLinksInNewTabChange: setOpenLinksInNewTab,
      onEnableHiddenSpace: hiddenSpace.enableWithPassword,
      onDisableHiddenSpace,
      onVerifyHiddenPassword: hiddenSpace.verifyPassword,
      onRemoveHiddenItems: hiddenSpace.removeHiddenItemsByIds,
      onRestoreHiddenItems,
      onAddItemFromSettings,
      onResetFolderHint: hiddenSpace.resetFolderWarnedInDev,
    }),
    [
      closeSettings,
      setLayoutMode,
      setOpenLinksInNewTab,
      hiddenSpace.enableWithPassword,
      onDisableHiddenSpace,
      hiddenSpace.verifyPassword,
      hiddenSpace.removeHiddenItemsByIds,
      onRestoreHiddenItems,
      onAddItemFromSettings,
      hiddenSpace.resetFolderWarnedInDev,
    ],
  );

  return {
    settingsState,
    settingsActions,
  };
}
