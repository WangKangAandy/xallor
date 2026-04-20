import { lazy, Suspense, useMemo, useState } from "react";
import {
  DEFAULT_NEW_TAB_BACKGROUND_URL,
  downloadWallpaper,
  getCurrentWallpaperSource,
  RemoteBackgroundImage,
} from "./components/feedback";
import { SettingsSpotlightModal } from "./components/SettingsSpotlightModal";
import { ENTER_ARRANGE_FROM_BACKGROUND_EVENT } from "./components/contextMenuEvents";
import { GlassMessageDialog } from "./components/shared/GlassMessageDialog";
import { GlassSurface } from "./components/shared/GlassSurface";
import { useGridBackgroundContextMenu } from "./components/useGridBackgroundContextMenu";
import { AppI18nProvider, useAppI18n } from "./i18n/AppI18n";
import { getLayoutCapabilities, UiPreferencesProvider, useUiPreferences } from "./preferences";
import { useRestModeController } from "./useRestModeController";
import { useHiddenSpace } from "./hiddenSpace/useHiddenSpace";
import type { GridItemType, SiteItem } from "./components/desktopGridTypes";

const SearchBar = lazy(async () => {
  const m = await import("./components/SearchBar");
  return { default: m.SearchBar };
});

const MultiDesktopStrip = lazy(async () => {
  const m = await import("./components/MultiDesktopStrip");
  return { default: m.MultiDesktopStrip };
});

const Sidebar = lazy(async () => {
  const m = await import("./components/Sidebar");
  return { default: m.Sidebar };
});

function MultiDesktopFallback() {
  const { t } = useAppI18n();
  return (
    <GlassSurface
      variant="fallbackPanel"
      rounded="3xl"
      className="w-full min-h-[320px] max-w-[1200px] xl:max-w-[1280px] mx-auto flex items-center justify-center text-white/70 text-sm"
      aria-hidden
    >
      {t("app.loadingDesktop")}
    </GlassSurface>
  );
}

function SidebarFallback() {
  return <div className="fixed left-0 top-0 h-full w-4 z-30" aria-hidden />;
}

function SearchBarFallback() {
  return (
    <GlassSurface
      variant="fallbackBar"
      rounded="full"
      className="w-full max-w-[640px] xl:max-w-[680px] 2xl:max-w-[720px] h-14 animate-pulse"
      aria-hidden
    />
  );
}

function AppContent() {
  const { t } = useAppI18n();
  const { isResting, handleDoubleClickCapture } = useRestModeController();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState<"privacy" | undefined>(undefined);
  const { layoutMode, setLayoutMode, openLinksInNewTab, setOpenLinksInNewTab, sidebarLayout } = useUiPreferences();
  const effectiveSidebarLayout = layoutMode === "minimal" ? "auto-hide" : sidebarLayout;
  const capabilities = useMemo(() => getLayoutCapabilities(layoutMode), [layoutMode]);
  const hiddenSpace = useHiddenSpace();
  const [restoreQueue, setRestoreQueue] = useState<SiteItem[]>([]);
  const [isDownloadingWallpaper, setIsDownloadingWallpaper] = useState(false);
  const { onContextMenu: onDesktopBackgroundContextMenu, portal: desktopBackgroundMenuPortal } =
    useGridBackgroundContextMenu(
      () => {
        window.dispatchEvent(new Event(ENTER_ARRANGE_FROM_BACKGROUND_EVENT));
      },
      async () => {
        if (isDownloadingWallpaper) return;
        setIsDownloadingWallpaper(true);
        try {
          const source =
            getCurrentWallpaperSource() ?? {
              kind: "unknown" as const,
              url: DEFAULT_NEW_TAB_BACKGROUND_URL,
            };
          const result = await downloadWallpaper(source);
          if (result.ok && result.mode === "download") {
            setAppMessage({ variant: "alert", message: "壁纸已开始下载" });
            return;
          }
          if (result.ok && result.mode === "fallback-opened") {
            setAppMessage({ variant: "alert", message: "自动下载失败，已打开原图，可手动保存" });
            return;
          }
          if (!result.ok && result.reason === "popup-blocked") {
            setAppMessage({
              variant: "alert",
              message: "自动下载失败，浏览器拦截了新窗口，请允许弹窗后重试",
            });
            return;
          }
          if (!result.ok && result.reason === "invalid-url") {
            setAppMessage({ variant: "alert", message: "背景地址无效，无法下载" });
            return;
          }
          setAppMessage({ variant: "alert", message: "下载失败，请稍后重试" });
        } finally {
          setIsDownloadingWallpaper(false);
        }
      },
      isDownloadingWallpaper,
    );
  const [appMessage, setAppMessage] = useState<
    | null
    | { variant: "alert"; message: string }
    | { variant: "alert-go-settings"; message: string }
    | { variant: "confirm-folder"; resolve: (ok: boolean) => void }
  >(null);

  const handleRequestHideItem = async (item: GridItemType) => {
    if (!hiddenSpace.isEnabled) {
      setAppMessage({ variant: "alert-go-settings", message: t("app.hiddenSpaceEnableHint") });
      return false;
    }
    if (item.type === "widget") return false;
    if (item.type === "folder" && !hiddenSpace.folderWarned) {
      const ok = await new Promise<boolean>((resolve) => {
        queueMicrotask(() => {
          setAppMessage({ variant: "confirm-folder", resolve });
        });
      });
      if (!ok) return false;
      hiddenSpace.markFolderWarned();
    }
    if (item.type === "site") {
      hiddenSpace.hideCandidates([{ type: "site", item }]);
    } else {
      hiddenSpace.hideCandidates([{ type: "folder", item }]);
    }
    return true;
  };

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden select-none"
      onDoubleClickCapture={handleDoubleClickCapture}
    >
      {/* 层级：背景无 z；主内容列见下方 z-10。全页装饰/宠物层请避开侧栏 z-30 与文件夹弹层 z-[100]，见 desktopGridLayers.ts */}
      {/* Background：外链图失败时由 RemoteBackgroundImage 降级为渐变，见 components/feedback */}
      <div className="absolute inset-0">
        <RemoteBackgroundImage src={DEFAULT_NEW_TAB_BACKGROUND_URL} />
        <GlassSurface
          variant="pageVeil"
          rounded="none"
          className="absolute inset-0 bg-gradient-to-b from-orange-50/10 via-blue-50/10 to-blue-200/20 dark:from-slate-950/40 dark:via-slate-900/30 dark:to-slate-800/40"
          aria-hidden
        />
      </div>

      <div
        className={`transition-[filter,opacity,transform] duration-300 ${
          isSettingsOpen ? "pointer-events-none brightness-75 saturate-75 blur-[2px]" : ""
        }`}
      >
        <div
          data-testid="sidebar-layer"
          className={`transition-opacity duration-700 ${isResting ? "opacity-0 pointer-events-none" : "opacity-100 delay-150"}`}
        >
          <Suspense fallback={<SidebarFallback />}>
            <Sidebar
              onOpenSettings={() => {
                setSettingsInitialSection(undefined);
                setIsSettingsOpen(true);
              }}
              layoutMode={effectiveSidebarLayout}
            />
          </Suspense>
        </div>

        {/* Main Content — z-10：搜索 + 桌面网格栈 */}
        <div
          className={`relative z-10 flex flex-col items-center pt-[15vh] px-8 md:px-16 xl:px-24 w-full h-screen overflow-y-auto pb-32 transition-all duration-700 ${
            isResting ? "opacity-0 scale-[0.985] pointer-events-none" : "opacity-100 scale-100"
          }`}
        >
          <div className="w-full flex flex-col items-center transition-all duration-700 xl:scale-[1.02] 2xl:scale-[1.05] xl:origin-top flex-1">
            {/* Search Bar */}
            <div
              className={`relative z-20 w-full max-w-[640px] xl:max-w-[680px] 2xl:max-w-[720px] mb-20 flex justify-center flex-shrink-0 transition-all duration-700 ${
                isResting ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0 delay-75"
              }`}
            >
              <Suspense fallback={<SearchBarFallback />}>
                <SearchBar />
              </Suspense>
            </div>

            {/* 主列 main slot：极简不挂载 MultiDesktopStrip（整理会话随之卸载） */}
            {capabilities.showDesktop ? (
              <div
                data-testid="desktop-main-slot"
                onContextMenu={onDesktopBackgroundContextMenu}
                className={`relative z-10 w-full flex-1 flex min-h-0 justify-center transition-all duration-700 ${
                  isResting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0 delay-150"
                }`}
              >
                <Suspense fallback={<MultiDesktopFallback />}>
                  <MultiDesktopStrip
                    onRequestHideItem={handleRequestHideItem}
                    restoreItems={restoreQueue}
                    onRestoreApplied={(ids) => {
                      hiddenSpace.removeHiddenItemsByIds(ids);
                      setRestoreQueue([]);
                    }}
                  />
                </Suspense>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* 可扩展保留层：未来电子宠物等可放在该层并在小憩状态保持可见/可交互。 */}
      <div className="pointer-events-none absolute inset-0 z-20" aria-hidden />
      <SettingsSpotlightModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialSection={settingsInitialSection}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
        openLinksInNewTab={openLinksInNewTab}
        onOpenLinksInNewTabChange={setOpenLinksInNewTab}
        hiddenSpaceEnabled={hiddenSpace.isEnabled}
        hiddenItems={hiddenSpace.hiddenItems}
        onEnableHiddenSpace={hiddenSpace.enableWithPassword}
        onDisableHiddenSpace={async (password) => {
          const ok = await hiddenSpace.verifyPassword(password);
          if (!ok) return false;
          hiddenSpace.clearAllAndDisable();
          return true;
        }}
        onVerifyHiddenPassword={hiddenSpace.verifyPassword}
        onRemoveHiddenItems={hiddenSpace.removeHiddenItemsByIds}
        onRestoreHiddenItems={(items) => setRestoreQueue(items)}
        isMinimalMode={layoutMode === "minimal"}
        folderHintResetVisible={hiddenSpace.isDev}
        onResetFolderHint={hiddenSpace.resetFolderWarnedInDev}
      />

      {appMessage?.variant === "alert" ? (
        <GlassMessageDialog
          open
          message={appMessage.message}
          variant="alert"
          confirmLabel={t("app.gotIt")}
          closeAriaLabel={t("settings.close")}
          onConfirm={() => setAppMessage(null)}
        />
      ) : null}
      {appMessage?.variant === "alert-go-settings" ? (
        <GlassMessageDialog
          open
          message={appMessage.message}
          variant="alert"
          confirmLabel={t("app.goToPrivacySecurity")}
          showCloseButton
          closeAriaLabel={t("settings.close")}
          onDismiss={() => setAppMessage(null)}
          onConfirm={() => {
            setAppMessage(null);
            setSettingsInitialSection("privacy");
            setIsSettingsOpen(true);
          }}
        />
      ) : null}
      {appMessage?.variant === "confirm-folder" ? (
        <GlassMessageDialog
          open
          title="隐藏文件夹"
          message="隐藏文件夹后，原文件夹会被删除，内部图标会按单图标形式移入隐藏空间，且不保留原文件夹结构。是否继续？"
          variant="confirm"
          cancelLabel="取消"
          confirmLabel="继续"
          onCancel={() => {
            const { resolve } = appMessage;
            setAppMessage(null);
            resolve(false);
          }}
          onConfirm={() => {
            const { resolve } = appMessage;
            setAppMessage(null);
            resolve(true);
          }}
        />
      ) : null}
      {desktopBackgroundMenuPortal}
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
