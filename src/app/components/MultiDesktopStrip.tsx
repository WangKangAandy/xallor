import { AnimatePresence, motion } from "motion/react";
import type { MultiPageGridState } from "../storage/types";
import { defaultFirstGridPagePayload } from "./desktopGridInitialItems";
import { DesktopGrid } from "./DesktopGrid";
import { DesktopPageDotsRow } from "./DesktopPageDotsRow";
import { DESKTOP_SLIDE_MS } from "./multiDesktopStripConstants";
import { useDesktopPageIndicator } from "./useDesktopPageIndicator";
import { useDesktopStripWheel } from "./useDesktopStripWheel";
import { useMultiPageGridPersistence } from "./useMultiPageGridPersistence";

const FALLBACK: MultiPageGridState = {
  pages: [defaultFirstGridPagePayload()],
  activePageIndex: 0,
};

/**
 * 横向多桌面：在桌面区域纵向滚轮向下 → 下一页（到末页则新建空白页）；向上 → 上一页。
 * 指示条与滚轮逻辑见 `useDesktopPageIndicator`、`useDesktopStripWheel`。
 */
export function MultiDesktopStrip() {
  const {
    pages,
    activePageIndex,
    isHydrated,
    setPageItems,
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

  return (
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
                items={page.items}
                setItems={(u) => setPageItems(page.pageId, u)}
                showLabels={page.showLabels}
                isHydrated={isHydrated}
                widgetLayout={page.widgetLayout}
                onChangeWidgetLayout={(layout) => setPageWidgetLayout(page.pageId, layout)}
                onToggleAutoCompact={(enabled) => setPageAutoCompactEnabled(page.pageId, enabled)}
                onChangeConflictStrategy={(strategy) => setPageConflictStrategy(page.pageId, strategy)}
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
  );
}
