import { Suspense } from "react";
import type { AppContentController } from "../useAppContentController";
import {
  MultiDesktopFallback,
  MultiDesktopStripLazy,
  SearchBarFallback,
  SearchBarLazy,
  SidebarFallback,
  SidebarLazy,
} from "./AppLazyParts";

type AppMainLayerProps = Pick<
  AppContentController,
  | "isSettingsOpen"
  | "openSettingsDefault"
  | "openSettingsWidgets"
  | "effectiveSidebarLayout"
  | "gridItemNamesVisible"
  | "capabilities"
  | "onDesktopBackgroundContextMenu"
  | "onRequestHideItem"
  | "restoreItems"
  | "pendingAddPayloads"
  | "onAddPayloadsConsumed"
  | "onRestoreApplied"
  | "isCustomContextMenuEnabled"
  | "onArrangeModeChange"
> & {
  isResting: boolean;
};

export function AppMainLayer({
  isSettingsOpen,
  isResting,
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
}: AppMainLayerProps) {
  return (
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
          <SidebarLazy onOpenSettings={openSettingsDefault} layoutMode={effectiveSidebarLayout} />
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
              <SearchBarLazy />
            </Suspense>
          </div>

          {/* 主列 main slot：极简不挂载 MultiDesktopStrip（整理会话随之卸载） */}
          {capabilities.showDesktop ? (
            <div
              data-testid="desktop-main-slot"
              onContextMenu={onDesktopBackgroundContextMenu}
              data-context-disabled={isCustomContextMenuEnabled ? undefined : "true"}
              className={`relative z-10 w-full flex-1 flex min-h-0 justify-center transition-all duration-700 ${
                isResting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0 delay-150"
              }`}
            >
              <Suspense fallback={<MultiDesktopFallback />}>
                <MultiDesktopStripLazy
                  onRequestHideItem={onRequestHideItem}
                  restoreItems={restoreItems}
                  gridItemNamesVisible={gridItemNamesVisible}
                  pendingAddPayloads={pendingAddPayloads}
                  onAddPayloadsConsumed={onAddPayloadsConsumed}
                  onOpenAddFromDesktop={openSettingsWidgets}
                  onRestoreApplied={onRestoreApplied}
                  onArrangeModeChange={onArrangeModeChange}
                />
              </Suspense>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
