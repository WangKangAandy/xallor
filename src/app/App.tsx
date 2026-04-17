import { lazy, Suspense, useState } from "react";
import { DEFAULT_NEW_TAB_BACKGROUND_URL, RemoteBackgroundImage } from "./components/feedback";
import { SettingsSpotlightModal } from "./components/SettingsSpotlightModal";
import { GlassSurface } from "./components/shared/GlassSurface";
import { useRestModeController } from "./useRestModeController";

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
  return (
    <GlassSurface
      variant="fallbackPanel"
      rounded="3xl"
      className="w-full min-h-[320px] max-w-[1200px] xl:max-w-[1280px] mx-auto flex items-center justify-center text-white/70 text-sm"
      aria-hidden
    >
      加载桌面…
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

export default function App() {
  const { isResting, handleDoubleClickCapture } = useRestModeController();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
          className="absolute inset-0 bg-gradient-to-b from-orange-50/10 via-blue-50/10 to-blue-200/20"
          aria-hidden
        />
      </div>

      <div
        className={`transition-[filter,opacity,transform] duration-300 ${
          isSettingsOpen ? "brightness-75 saturate-75 blur-[2px]" : ""
        }`}
      >
        <div
          data-testid="sidebar-layer"
          className={`transition-opacity duration-700 ${isResting ? "opacity-0 pointer-events-none" : "opacity-100 delay-150"}`}
        >
          <Suspense fallback={<SidebarFallback />}>
            <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />
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
              className={`relative z-20 w-full max-w-[640px] xl:max-w-[680px] 2xl:max-w-[720px] mb-12 flex justify-center flex-shrink-0 transition-all duration-700 ${
                isResting ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0 delay-75"
              }`}
            >
              <Suspense fallback={<SearchBarFallback />}>
                <SearchBar />
              </Suspense>
            </div>

            {/* 多桌面条带（纵向滚轮切页）；单页时与原先单网格一致 */}
            <div
              className={`relative z-10 w-full flex-1 flex min-h-0 justify-center max-w-[1200px] xl:max-w-[1280px] transition-all duration-700 ${
                isResting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0 delay-150"
              }`}
            >
              <Suspense fallback={<MultiDesktopFallback />}>
                <MultiDesktopStrip />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* 可扩展保留层：未来电子宠物等可放在该层并在小憩状态保持可见/可交互。 */}
      <div className="pointer-events-none absolute inset-0 z-20" aria-hidden />
      <SettingsSpotlightModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
