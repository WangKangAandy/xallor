import { lazy, Suspense } from "react";
import { DEFAULT_NEW_TAB_BACKGROUND_URL, RemoteBackgroundImage } from "./components/feedback";

const SearchBar = lazy(async () => {
  const m = await import("./components/SearchBar");
  return { default: m.SearchBar };
});

const DesktopGrid = lazy(async () => {
  const m = await import("./components/DesktopGrid");
  return { default: m.DesktopGrid };
});

const Sidebar = lazy(async () => {
  const m = await import("./components/Sidebar");
  return { default: m.Sidebar };
});

function DesktopGridFallback() {
  return (
    <div
      className="w-full min-h-[320px] max-w-[1200px] xl:max-w-[1280px] mx-auto flex items-center justify-center rounded-3xl border border-white/20 bg-white/5 text-white/70 text-sm backdrop-blur-sm"
      aria-hidden
    >
      加载桌面网格…
    </div>
  );
}

function SidebarFallback() {
  return <div className="fixed left-0 top-0 h-full w-4 z-30" aria-hidden />;
}

function SearchBarFallback() {
  return (
    <div
      className="w-full max-w-[640px] xl:max-w-[680px] 2xl:max-w-[720px] h-14 rounded-full border border-white/25 bg-white/10 backdrop-blur-sm animate-pulse"
      aria-hidden
    />
  );
}

export default function App() {
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* 层级：背景无 z；主内容列见下方 z-10。全页装饰/宠物层请避开侧栏 z-30 与文件夹弹层 z-[100]，见 desktopGridLayers.ts */}
      {/* Background：外链图失败时由 RemoteBackgroundImage 降级为渐变，见 components/feedback */}
      <div className="absolute inset-0">
        <RemoteBackgroundImage src={DEFAULT_NEW_TAB_BACKGROUND_URL} />
        <div className="absolute inset-0 bg-gradient-to-b from-orange-50/10 via-blue-50/10 to-blue-200/20 backdrop-blur-[1px]" />
      </div>

      <Suspense fallback={<SidebarFallback />}>
        <Sidebar />
      </Suspense>

      {/* Main Content — z-10：搜索 + 桌面网格栈 */}
      <div className="relative z-10 flex flex-col items-center pt-[15vh] px-8 md:px-16 xl:px-24 w-full h-screen overflow-y-auto pb-32">
        <div className="w-full flex flex-col items-center transition-all duration-700 xl:scale-[1.02] 2xl:scale-[1.05] xl:origin-top flex-1">
          {/* Search Bar */}
          <div className="w-full max-w-[640px] xl:max-w-[680px] 2xl:max-w-[720px] mb-12 flex justify-center flex-shrink-0 transition-all duration-500">
            <Suspense fallback={<SearchBarFallback />}>
              <SearchBar />
            </Suspense>
          </div>

          {/* Unified Desktop Grid */}
          <div className="w-full flex-1 flex justify-center max-w-[1200px] xl:max-w-[1280px] transition-all duration-500">
            <Suspense fallback={<DesktopGridFallback />}>
              <DesktopGrid />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}