import { AppI18nProvider, useAppI18n } from "./i18n/AppI18n";
import { UiPreferencesProvider } from "./preferences";
import { useRestModeController } from "./useRestModeController";
import { useAppContentController } from "./useAppContentController";
import { AppBackgroundLayer, AppMainLayer, AppOverlayLayer } from "./appShell";

function AppContent() {
  const { t } = useAppI18n();
  const { isResting, handleDoubleClickCapture } = useRestModeController();
  const {
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
  } = useAppContentController({
    hiddenSpaceEnableHintMessage: t("app.hiddenSpaceEnableHint"),
  });

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden select-none"
      onDoubleClickCapture={handleDoubleClickCapture}
    >
      {/* 层级：背景无 z；主内容列见下方 z-10。全页装饰/宠物层请避开侧栏 z-30 与文件夹弹层 z-[100]，见 desktopGridLayers.ts */}
      {/* Background：外链图失败时由 RemoteBackgroundImage 降级为渐变，见 components/feedback */}
      <AppBackgroundLayer />
      <AppMainLayer
        isSettingsOpen={isSettingsOpen}
        isResting={isResting}
        openSettingsDefault={openSettingsDefault}
        openSettingsWidgets={openSettingsWidgets}
        effectiveSidebarLayout={effectiveSidebarLayout}
        gridItemNamesVisible={gridItemNamesVisible}
        capabilities={capabilities}
        onDesktopBackgroundContextMenu={onDesktopBackgroundContextMenu}
        onRequestHideItem={onRequestHideItem}
        restoreItems={restoreItems}
        pendingAddPayloads={pendingAddPayloads}
        onAddPayloadsConsumed={onAddPayloadsConsumed}
        onRestoreApplied={onRestoreApplied}
        isCustomContextMenuEnabled={isCustomContextMenuEnabled}
        onArrangeModeChange={onArrangeModeChange}
      />
      <AppOverlayLayer
        settingsState={settingsState}
        settingsActions={settingsActions}
        appMessage={appMessage}
        clearMessage={clearMessage}
        openSettingsPrivacy={openSettingsPrivacy}
        resolveFolderHideConfirm={resolveFolderHideConfirm}
        desktopBackgroundMenuPortal={desktopBackgroundMenuPortal}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppI18nProvider>
      <UiPreferencesProvider>
        <AppContent />
      </UiPreferencesProvider>
    </AppI18nProvider>
  );
}
