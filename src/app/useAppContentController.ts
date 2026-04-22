import { useCallback, useMemo, useState } from "react";
import { type GridItemType } from "./components/desktopGridTypes";
import { getLayoutCapabilities, useUiPreferences } from "./preferences";
import { useHiddenSpace } from "./hiddenSpace/useHiddenSpace";
import { useDesktopBackgroundActions } from "./useDesktopBackgroundActions";
import { useAppMessageState } from "./useAppMessageState";
import { useHideItemRequest } from "./useHideItemRequest";
import { useSettingsModalController } from "./useSettingsModalController";
import { useSettingsDesktopIntegration } from "./useSettingsDesktopIntegration";

type UseAppContentControllerParams = {
  hiddenSpaceEnableHintMessage: string;
};

export function useAppContentController({ hiddenSpaceEnableHintMessage }: UseAppContentControllerParams) {
  const [isCustomContextMenuEnabled, setIsCustomContextMenuEnabled] = useState(true);
  const {
    isSettingsOpen,
    openSettingsDefault,
    openSettingsPrivacy,
    openSettingsWidgets,
    openSettingsWallpaper,
    settingsInitialSection,
    closeSettings,
  } = useSettingsModalController();
  const {
    layoutMode,
    setLayoutMode,
    openLinksInNewTab,
    setOpenLinksInNewTab,
    sidebarLayout,
    gridItemNamesVisible,
  } = useUiPreferences();
  const capabilities = useMemo(() => getLayoutCapabilities(layoutMode), [layoutMode]);
  const effectiveSidebarLayout = layoutMode === "minimal" ? "auto-hide" : sidebarLayout;
  const hiddenSpace = useHiddenSpace();
  const {
    appMessage,
    clearMessage,
    showAlert,
    showGoToSettingsAlert,
    requestFolderHideConfirm,
    resolveFolderHideConfirm,
  } = useAppMessageState();
  const { onDesktopBackgroundContextMenu, desktopBackgroundMenuPortal } = useDesktopBackgroundActions({
    onOpenAddSiteOrComponent: openSettingsWidgets,
    onOpenWallpaperSettings: openSettingsWallpaper,
    onShowAlert: showAlert,
  });
  const onRequestHideItem = useHideItemRequest({
    isHiddenSpaceEnabled: hiddenSpace.isEnabled,
    isFolderWarned: hiddenSpace.folderWarned,
    showEnableHint: () => {
      showGoToSettingsAlert(hiddenSpaceEnableHintMessage);
    },
    requestFolderConfirm: requestFolderHideConfirm,
    markFolderWarned: hiddenSpace.markFolderWarned,
    hideCandidates: hiddenSpace.hideCandidates,
  });
  const {
    settingsState,
    settingsActions,
    restoreItems,
    pendingAddPayloads,
    onAddPayloadsConsumed,
    onRestoreApplied,
  } = useSettingsDesktopIntegration({
    isSettingsOpen,
    settingsInitialSection,
    closeSettings,
    layoutMode,
    setLayoutMode,
    openLinksInNewTab,
    setOpenLinksInNewTab,
    hiddenSpace,
  });
  const onArrangeModeChange = useCallback((isArrangeMode: boolean) => {
    setIsCustomContextMenuEnabled(!isArrangeMode);
  }, []);

  return {
    isSettingsOpen,
    openSettingsDefault,
    openSettingsPrivacy,
    openSettingsWidgets,
    effectiveSidebarLayout,
    gridItemNamesVisible,
    capabilities,
    onDesktopBackgroundContextMenu,
    desktopBackgroundMenuPortal,
    onRequestHideItem,
    settingsState,
    settingsActions,
    restoreItems,
    pendingAddPayloads,
    onAddPayloadsConsumed,
    onRestoreApplied,
    isCustomContextMenuEnabled,
    onArrangeModeChange,
    appMessage,
    clearMessage,
    resolveFolderHideConfirm,
  };
}

export type AppContentController = ReturnType<typeof useAppContentController>;
export type AppOnRequestHideItem = (item: GridItemType) => Promise<boolean>;
