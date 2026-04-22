import { useCallback, useMemo, type Dispatch, type SetStateAction } from "react";
import type { LayoutMode } from "./preferences";
import type { SiteItem } from "./components/desktopGridTypes";
import type { AddIconSubmitPayload } from "./components/addIcon";
import type { AppSettingsInitialSection } from "./useSettingsModalController";

type HiddenSpaceBinding = {
  isEnabled: boolean;
  hiddenItems: SiteItem[];
  isDev: boolean;
  enableWithPassword: (password: string) => Promise<void>;
  verifyPassword: (password: string) => Promise<boolean>;
  clearAllAndDisable: () => void;
  removeHiddenItemsByIds: (ids: string[]) => void;
  resetFolderWarnedInDev: () => void;
};

type UseSettingsSpotlightBindingsParams = {
  isSettingsOpen: boolean;
  settingsInitialSection: AppSettingsInitialSection;
  closeSettings: () => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  openLinksInNewTab: boolean;
  setOpenLinksInNewTab: (value: boolean) => void;
  hiddenSpace: HiddenSpaceBinding;
  setRestoreQueue: Dispatch<SetStateAction<SiteItem[]>>;
  setSettingsAddQueue: Dispatch<SetStateAction<AddIconSubmitPayload[]>>;
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
  setRestoreQueue,
  setSettingsAddQueue,
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

  const onRestoreHiddenItems = useCallback(
    (items: SiteItem[]) => {
      setRestoreQueue(items);
    },
    [setRestoreQueue],
  );

  const onAddItemFromSettings = useCallback(
    (payload: AddIconSubmitPayload) => {
      setSettingsAddQueue((prev) => [...prev, payload]);
    },
    [setSettingsAddQueue],
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
      folderHintResetVisible: hiddenSpace.isDev,
    }),
    [hiddenSpace.hiddenItems, hiddenSpace.isDev, hiddenSpace.isEnabled, isSettingsOpen, layoutMode, openLinksInNewTab, settingsInitialSection],
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
