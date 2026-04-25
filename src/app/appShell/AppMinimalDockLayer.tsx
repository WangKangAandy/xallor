import { AnimatePresence, motion } from "motion/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { AppMinimalDockLayerBundle } from "../useAppContentController";
import { isMinimalDockEnabled } from "../preferences";
import { MinimalDockBar } from "../minimalDock/MinimalDockBar";
import { MinimalDockHoverShell } from "../minimalDock/MinimalDockHoverShell";
import { usePrefersReducedMotion } from "../minimalDock/usePrefersReducedMotion";
import { Z_MINIMAL_DOCK_LAYER } from "../components/desktopGridLayers";

export type AppMinimalDockLayerProps = AppMinimalDockLayerBundle;

/**
 * 极简 Dock 独立层：须挂在 {@link AppOverlayLayer} **之后**（DOM 顺序），叠在设置全屏层（z-[120]）之上，
 * 否则仅靠 z-index 仍可能被后绘制的遮罩盖住。
 */
export function AppMinimalDockLayer({
  layoutMode,
  minimalDockMode,
  minimalDockEntries,
  onMinimalDockReorder,
  openSettingsWidgets,
  isCustomContextMenuEnabled,
  onMinimalDockDeleteSiteEntry,
  onMinimalDockHideSiteEntry,
  onMinimalDockEnterArrangeMode,
}: AppMinimalDockLayerProps) {
  const dockLayerEnabled = layoutMode === "minimal" && isMinimalDockEnabled(minimalDockMode);
  // 仅在 auto-hide 且存在站点时启用收起/唤出；空 Dock 需要露出「+」给用户发现入口。
  const shouldAutoHideDock =
    minimalDockMode === "auto_hide" && minimalDockEntries.some((entry) => entry.kind === "site");
  const reduceMotion = usePrefersReducedMotion();

  return (
    <AnimatePresence>
      {dockLayerEnabled ? (
        <motion.div
          key="minimal-dock-layer"
          className="pointer-events-none fixed inset-x-0 bottom-0 flex justify-center pb-1"
          style={{ zIndex: Z_MINIMAL_DOCK_LAYER }}
          initial={reduceMotion ? { opacity: 0 } : { y: 40, opacity: 0 }}
          animate={reduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { y: 32, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="pointer-events-auto mx-auto flex max-w-[100vw] justify-center">
            <div
              className="flex w-fit max-w-full flex-col items-center justify-end pb-2 pt-1"
              data-testid="minimal-dock-shell"
            >
              <DndProvider backend={HTML5Backend}>
                {shouldAutoHideDock ? (
                  <MinimalDockHoverShell reduceMotion={reduceMotion}>
                    <MinimalDockBar
                      entries={minimalDockEntries}
                      onReorder={onMinimalDockReorder}
                      onOpenWidgets={openSettingsWidgets}
                      isCustomContextMenuEnabled={isCustomContextMenuEnabled}
                      onDockSiteDelete={onMinimalDockDeleteSiteEntry}
                      onDockSiteHide={onMinimalDockHideSiteEntry}
                      onDockEnterArrangeMode={onMinimalDockEnterArrangeMode}
                    />
                  </MinimalDockHoverShell>
                ) : (
                  <MinimalDockBar
                    entries={minimalDockEntries}
                    onReorder={onMinimalDockReorder}
                    onOpenWidgets={openSettingsWidgets}
                    isCustomContextMenuEnabled={isCustomContextMenuEnabled}
                    onDockSiteDelete={onMinimalDockDeleteSiteEntry}
                    onDockSiteHide={onMinimalDockHideSiteEntry}
                    onDockEnterArrangeMode={onMinimalDockEnterArrangeMode}
                  />
                )}
              </DndProvider>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
