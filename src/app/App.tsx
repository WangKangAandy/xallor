import { AppI18nProvider, useAppI18n } from "./i18n/AppI18n";
import { UserLocalAssetsProvider } from "./localUpload";
import { UiPreferencesProvider } from "./preferences";
import { useRestModeController } from "./useRestModeController";
import { useAppContentController } from "./useAppContentController";
import { AppBackgroundLayer, AppMainLayer, AppOverlayLayer } from "./appShell";

function AppContent() {
  const { t } = useAppI18n();
  const { isResting, handleDoubleClickCapture } = useRestModeController();
  const { mainLayer, overlayLayer } = useAppContentController({
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
      <AppMainLayer isResting={isResting} {...mainLayer} />
      <AppOverlayLayer {...overlayLayer} />
    </div>
  );
}

export default function App() {
  return (
    <AppI18nProvider>
      <UiPreferencesProvider>
        <UserLocalAssetsProvider>
          <AppContent />
        </UserLocalAssetsProvider>
      </UiPreferencesProvider>
    </AppI18nProvider>
  );
}
