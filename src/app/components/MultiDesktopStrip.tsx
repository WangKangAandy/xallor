import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { MultiPageGridState } from "../storage/types";
import { defaultFirstGridPagePayload } from "./desktopGridInitialItems";
import { DesktopGrid } from "./DesktopGrid";
import type { ArrangeGestureGridRuntime } from "./arrange/useArrangeGestureController";
import { DesktopPageDotsRow } from "./DesktopPageDotsRow";
import { DESKTOP_SLIDE_MS } from "./multiDesktopStripConstants";
import { useArrangeGestureController } from "./arrange/useArrangeGestureController";
import { useArrangeSession } from "./arrange/useArrangeSession";
import { ENTER_ARRANGE_FROM_BACKGROUND_EVENT } from "./contextMenuEvents";
import { useDesktopPageIndicator } from "./useDesktopPageIndicator";
import { useDesktopStripWheel } from "./useDesktopStripWheel";
import { useMultiPageGridPersistence } from "./useMultiPageGridPersistence";
import type { GridItemType, SiteItem } from "./desktopGridTypes";

const FALLBACK: MultiPageGridState = {
  pages: [defaultFirstGridPagePayload()],
  activePageIndex: 0,
};

type MultiDesktopStripProps = {
  onRequestHideItem?: (item: GridItemType) => boolean | Promise<boolean>;
  restoreItems?: SiteItem[];
  onRestoreApplied?: (ids: string[]) => void;
  gridItemNamesVisible?: boolean;
};

/**
 * 横向多桌面：在桌面区域纵向滚轮向下 → 下一页（到末页则新建空白页）；向上 → 上一页。
 * 指示条与滚轮逻辑见 `useDesktopPageIndicator`、`useDesktopStripWheel`。
 */
export function MultiDesktopStrip({
  onRequestHideItem,
  restoreItems = [],
  onRestoreApplied,
  gridItemNamesVisible = true,
}: MultiDesktopStripProps) {
  const arrangeSession = useArrangeSession();
  const runtimeRegistryRef = useRef<Map<string, ArrangeGestureGridRuntime>>(new Map());
  const {
    pages,
    activePageIndex,
    isHydrated,
    applyMultiPageItemsPatch,
    setPageWidgetLayout,
    setPageAutoCompactEnabled,
    setPageConflictStrategy,
    goNextPage,
    goPrevPage,
  } = useMultiPageGridPersistence(FALLBACK);

  const {
    showDotsPill,
    pulseEpoch,
    pulseTransition,
    stripTransition,
    reduceMotion,
    triggerRejectFeedback,
  } = useDesktopPageIndicator(isHydrated, pages, activePageIndex);

  const viewportRef = useDesktopStripWheel({
    isHydrated,
    pages,
    activePageIndex,
    goNextPage,
    goPrevPage,
    onWheelReject: triggerRejectFeedback,
  });

  const pageCount = Math.max(pages.length, 1);
  const translatePct = (activePageIndex / pageCount) * 100;
  const handleArrangeRuntimeMount = useCallback((runtime: ArrangeGestureGridRuntime) => {
    runtimeRegistryRef.current.set(runtime.gridId, runtime);
  }, []);
  const handleArrangeRuntimeUnmount = useCallback((gridId: string) => {
    runtimeRegistryRef.current.delete(gridId);
  }, []);
  const getGridRuntimes = useCallback(() => Array.from(runtimeRegistryRef.current.values()), []);
  useArrangeGestureController({ arrangeSession, getGridRuntimes });

  const pendingRestoreIds = restoreItems.map((item) => item.id).join("|");
  // 统一将恢复项追加到最后一页末尾；当前网格为自动流布局，不保留原始位置与文件夹结构。
  useEffect(() => {
    if (restoreItems.length === 0) return;
    const lastPage = pages[pages.length - 1];
    if (!lastPage) return;
    applyMultiPageItemsPatch({
      [lastPage.pageId]: (prev) => [...prev, ...restoreItems],
    });
    onRestoreApplied?.(restoreItems.map((item) => item.id));
  }, [pendingRestoreIds, restoreItems, pages, applyMultiPageItemsPatch, onRestoreApplied]);

  const handleHideItem = useCallback(
    async (pageId: string, itemId: string) => {
      const page = pages.find((p) => p.pageId === pageId);
      const item = page?.items.find((entry) => entry.id === itemId);
      if (!item || !onRequestHideItem) return;
      const accepted = await onRequestHideItem(item);
      if (!accepted) return;
      applyMultiPageItemsPatch({
        [pageId]: (prev) => prev.filter((entry) => entry.id !== itemId),
      });
    },
    [pages, onRequestHideItem, applyMultiPageItemsPatch],
  );
  const handleEnterArrangeMode = useCallback(() => {
    const active = pages[activePageIndex];
    arrangeSession.enterArrangeMode(active?.pageId ?? "__single_page__");
  }, [arrangeSession, pages, activePageIndex]);
  useEffect(() => {
    const onEnterArrange = () => handleEnterArrangeMode();
    window.addEventListener(ENTER_ARRANGE_FROM_BACKGROUND_EVENT, onEnterArrange);
    return () => window.removeEventListener(ENTER_ARRANGE_FROM_BACKGROUND_EVENT, onEnterArrange);
  }, [handleEnterArrangeMode]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        ref={viewportRef}
        className="relative w-full flex-1 min-h-[320px] min-w-0 overflow-hidden"
        role="region"
        aria-label="多桌面工作区，纵向滚轮切换左右页"
      >
        <div
          className="flex h-full w-full ease-out motion-reduce:transition-none"
          style={{
            width: `${pageCount * 100}%`,
            transform: `translateX(-${translatePct}%)`,
            transitionProperty: "transform",
            transitionDuration: `${DESKTOP_SLIDE_MS}ms`,
          }}
        >
          {pages.map((page) => (
            <div
              key={page.pageId}
              className="box-border flex shrink-0 justify-center px-0"
              style={{ flex: `0 0 ${100 / pageCount}%` }}
            >
              <div className="w-full max-w-[1200px] xl:max-w-[1280px]">
                <DesktopGrid
                  pageId={page.pageId}
                  onArrangeRuntimeMount={handleArrangeRuntimeMount}
                  onArrangeRuntimeUnmount={handleArrangeRuntimeUnmount}
                  arrangeSession={arrangeSession}
                  items={page.items}
                  setItems={(u) => applyMultiPageItemsPatch({ [page.pageId]: u })}
                  showLabels={page.showLabels && gridItemNamesVisible}
                  isHydrated={isHydrated}
                  widgetLayout={page.widgetLayout}
                  onChangeWidgetLayout={(layout) => setPageWidgetLayout(page.pageId, layout)}
                  onToggleAutoCompact={(enabled) => setPageAutoCompactEnabled(page.pageId, enabled)}
                  onChangeConflictStrategy={(strategy) => setPageConflictStrategy(page.pageId, strategy)}
                  onHideItem={(itemId) => {
                    void handleHideItem(page.pageId, itemId);
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <AnimatePresence>
          {showDotsPill && (
            <motion.div
              key="desktop-page-dots"
              initial={reduceMotion ? { opacity: 0 } : { y: 22, opacity: 0 }}
              animate={reduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { y: 14, opacity: 0, transition: { type: "spring", stiffness: 400, damping: 34 } }
              }
              transition={stripTransition}
              className="pointer-events-none absolute bottom-3 left-1/2 z-[5] flex -translate-x-1/2 gap-1.5 rounded-full glass-surface-strip px-2.5 py-1.5 text-[10px] text-white/85"
              aria-hidden
            >
              <div className="flex gap-1.5">
                <DesktopPageDotsRow
                  pages={pages}
                  activePageIndex={activePageIndex}
                  pulseEpoch={pulseEpoch}
                  reduceMotion={reduceMotion}
                  pulseTransition={pulseTransition}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DndProvider>
  );
}
