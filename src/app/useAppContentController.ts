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
    openSettingsAt,
    openSettingsDefault,
    openSettingsPrivacy,
    openSettingsWidgets,
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
    minimalDockMode,
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
  const openWidgetsFromBackground = useCallback(() => {
    openSettingsAt("widgets");
  }, [openSettingsAt]);
  const openWallpaperFromBackground = useCallback(() => {
    openSettingsAt("wallpaper");
  }, [openSettingsAt]);
  const { onDesktopBackgroundContextMenu, desktopBackgroundMenuPortal } = useDesktopBackgroundActions({
    layoutMode,
    onOpenAddSiteOrComponent: openWidgetsFromBackground,
    onOpenWallpaperSettings: openWallpaperFromBackground,
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
    minimalDockEntries,
    onMinimalDockReorder,
    onMinimalDockDeleteSiteEntry,
    onMinimalDockHideSiteEntry,
    onMinimalDockEnterArrangeMode,
  } = useSettingsDesktopIntegration({
    isSettingsOpen,
    settingsInitialSection,
    closeSettings,
    layoutMode,
    setLayoutMode,
    openLinksInNewTab,
    setOpenLinksInNewTab,
    hiddenSpace,
    onRequestHideGridItem: onRequestHideItem,
  });
  const onArrangeModeChange = useCallback((isArrangeMode: boolean) => {
    setIsCustomContextMenuEnabled(!isArrangeMode);
  }, []);

  const mainLayer = useMemo(
    () => ({
      isSettingsOpen,
      openSettingsDefault,
      openSettingsWidgets,
      effectiveSidebarLayout,
      gridItemNamesVisible,
      capabilities,
      onDesktopBackgroundContextMenu,
      onRequestHideItem,
      restoreItems,
      pendingAddPayloads,
      onAddPayloadsConsumed,
      onRestoreApplied,
      isCustomContextMenuEnabled,
      onArrangeModeChange,
      layoutMode,
      minimalDockMode,
    }),
    [
      isSettingsOpen,
      openSettingsDefault,
      openSettingsWidgets,
      effectiveSidebarLayout,
      gridItemNamesVisible,
      capabilities,
      onDesktopBackgroundContextMenu,
      onRequestHideItem,
      restoreItems,
      pendingAddPayloads,
      onAddPayloadsConsumed,
      onRestoreApplied,
      isCustomContextMenuEnabled,
      onArrangeModeChange,
      layoutMode,
      minimalDockMode,
    ],
  );

  const minimalDockLayer = useMemo(
    () => ({
      layoutMode,
      minimalDockMode,
      minimalDockEntries,
      onMinimalDockReorder,
      openSettingsWidgets,
      isCustomContextMenuEnabled,
      onMinimalDockDeleteSiteEntry,
      onMinimalDockHideSiteEntry,
      onMinimalDockEnterArrangeMode,
    }),
    [
      layoutMode,
      minimalDockMode,
      minimalDockEntries,
      onMinimalDockReorder,
      openSettingsWidgets,
      isCustomContextMenuEnabled,
      onMinimalDockDeleteSiteEntry,
      onMinimalDockHideSiteEntry,
      onMinimalDockEnterArrangeMode,
    ],
  );

  const overlayLayer = useMemo(
    () => ({
      settingsState,
      settingsActions,
      appMessage,
      clearMessage,
      openSettingsPrivacy,
      resolveFolderHideConfirm,
      desktopBackgroundMenuPortal,
    }),
    [
      settingsState,
      settingsActions,
      appMessage,
      clearMessage,
      openSettingsPrivacy,
      resolveFolderHideConfirm,
      desktopBackgroundMenuPortal,
    ],
  );

  return {
    mainLayer,
    minimalDockLayer,
    overlayLayer,
  };
}

export type AppContentController = ReturnType<typeof useAppContentController>;
export type AppMainLayerBundle = AppContentController["mainLayer"];
export type AppMinimalDockLayerBundle = AppContentController["minimalDockLayer"];
export type AppOverlayLayerBundle = AppContentController["overlayLayer"];
export type AppOnRequestHideItem = (item: GridItemType) => Promise<boolean>;
