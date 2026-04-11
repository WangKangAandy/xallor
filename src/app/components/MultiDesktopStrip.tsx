import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { MultiPageGridState } from "../storage/types";
import { DEFAULT_GRID_PAYLOAD } from "./desktopGridInitialItems";
import { DesktopGrid } from "./DesktopGrid";
import { canWheelNextPage, useMultiPageGridPersistence } from "./useMultiPageGridPersistence";

const FALLBACK: MultiPageGridState = {
  pages: [DEFAULT_GRID_PAYLOAD],
  activePageIndex: 0,
};

const WHEEL_COOLDOWN_MS = 450;
const WHEEL_DELTA_MIN = 8;

/** 与桌面横滑 `transition-transform duration-300` 对齐，完成态脉冲略晚于位移落点 */
const PAGE_SLIDE_MS = 300;
/** 指示条停留时长（每次切页或拒绝反馈时重置） */
const DOTS_AUTO_HIDE_MS = 800;

/**
 * 横向多桌面：在桌面区域纵向滚轮向下 → 下一页（到末页则新建空白页）；向上 → 上一页。
 * 多页指示点：默认隐藏；切页时自下而上浮现；末页为空且继续向下滚时指示条短暂出现，当前小白点脉冲与成功切页相同（共用 pulseEpoch）。
 */
export function MultiDesktopStrip() {
  const { pages, activePageIndex, isHydrated, setPageItems, goNextPage, goPrevPage } =
    useMultiPageGridPersistence(FALLBACK);

  const viewportRef = useRef<HTMLDivElement>(null);
  const lastWheelAt = useRef(0);

  const reduceMotion = useReducedMotion();
  const prevActiveRef = useRef<number | null>(null);
  const prevPageCountRef = useRef(0);

  const [dotsVisible, setDotsVisible] = useState(false);
  const [pulseEpoch, setPulseEpoch] = useState(0);
  /** 单页场景下仍需显示圆点条时置位；与 `pulseEpoch` 解耦，动画只由 pulseEpoch 驱动（与切页一致）。 */
  const [rejectShakeGeneration, setRejectShakeGeneration] = useState(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const scheduleDotsAutoHide = () => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setDotsVisible(false);
      setRejectShakeGeneration(0);
      hideTimerRef.current = null;
    }, DOTS_AUTO_HIDE_MS);
  };

  useEffect(() => {
    return () => clearHideTimer();
  }, []);

  /** 从多页回到单页时收起指示条 */
  useEffect(() => {
    if (prevPageCountRef.current > 1 && pages.length === 1) {
      clearHideTimer();
      setDotsVisible(false);
      setRejectShakeGeneration(0);
    }
    prevPageCountRef.current = pages.length;
  }, [pages.length]);

  /** 多页且页索引变化：显示指示条 + 完成态脉冲 */
  useEffect(() => {
    if (!isHydrated) return;
    if (pages.length <= 1) {
      prevActiveRef.current = activePageIndex;
      return;
    }
    if (prevActiveRef.current === null) {
      prevActiveRef.current = activePageIndex;
      return;
    }
    if (prevActiveRef.current !== activePageIndex) {
      prevActiveRef.current = activePageIndex;
      clearHideTimer();
      setRejectShakeGeneration(0);
      setPulseEpoch((n) => n + 1);
      setDotsVisible(true);
      scheduleDotsAutoHide();
    }
  }, [activePageIndex, isHydrated, pages.length]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const passiveFalse = { passive: false } as AddEventListenerOptions;
    const handler = (ev: WheelEvent) => {
      if (!isHydrated) return;
      if (Math.abs(ev.deltaY) < WHEEL_DELTA_MIN && Math.abs(ev.deltaX) < WHEEL_DELTA_MIN) return;
      const dominantVertical = Math.abs(ev.deltaY) >= Math.abs(ev.deltaX);
      if (!dominantVertical) return;
      const now = Date.now();
      if (now - lastWheelAt.current < WHEEL_COOLDOWN_MS) {
        ev.preventDefault();
        return;
      }
      lastWheelAt.current = now;
      ev.preventDefault();

      if (ev.deltaY > 0) {
        if (!canWheelNextPage(pages, activePageIndex)) {
          clearHideTimer();
          setRejectShakeGeneration((g) => g + 1);
          setPulseEpoch((n) => n + 1);
          setDotsVisible(true);
          scheduleDotsAutoHide();
          return;
        }
        goNextPage();
      } else {
        goPrevPage();
      }
    };
    el.addEventListener("wheel", handler, passiveFalse);
    return () => el.removeEventListener("wheel", handler);
  }, [isHydrated, goNextPage, goPrevPage, pages, activePageIndex]);

  const pageCount = Math.max(pages.length, 1);
  const translatePct = (activePageIndex / pageCount) * 100;

  const stripTransition = reduceMotion
    ? { duration: 0.2 }
    : { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.85 };

  const pulseTransition = reduceMotion
    ? { duration: 0 }
    : {
        delay: PAGE_SLIDE_MS / 1000,
        duration: 0.42,
        times: [0, 0.42, 1],
        ease: [0.22, 1, 0.36, 1],
      };

  const showDotsPill =
    dotsVisible &&
    pages.length >= 1 &&
    (pages.length > 1 || rejectShakeGeneration > 0);

  return (
    <div
      ref={viewportRef}
      className="relative w-full flex-1 min-h-[320px] min-w-0 overflow-hidden"
      role="region"
      aria-label="多桌面工作区，纵向滚轮切换左右页"
    >
      <div
        className="flex h-full w-full transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{
          width: `${pageCount * 100}%`,
          transform: `translateX(-${translatePct}%)`,
        }}
      >
        {pages.map((page, i) => (
          <div
            key={`desktop-page-${i}`}
            className="box-border flex shrink-0 justify-center px-0"
            style={{ flex: `0 0 ${100 / pageCount}%` }}
          >
            <div className="w-full max-w-[1200px] xl:max-w-[1280px]">
              <DesktopGrid
                items={page.items}
                setItems={(u) => setPageItems(i, u)}
                showLabels={page.showLabels}
                isHydrated={isHydrated}
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
            className="pointer-events-none absolute bottom-3 left-1/2 z-[5] flex -translate-x-1/2 gap-1.5 rounded-full bg-black/25 px-2.5 py-1.5 text-[10px] text-white/85 shadow-lg backdrop-blur-md"
            aria-hidden
          >
            <div className="flex gap-1.5">
              {renderDotRow(pages, activePageIndex, pulseEpoch, reduceMotion, pulseTransition)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** 当前白点脉冲：切页与「拒绝新建」共用同一套 scale / transition（pulseEpoch 递增即重播）。 */
function renderDotRow(
  pages: { items: unknown[] }[],
  activePageIndex: number,
  pulseEpoch: number,
  reduceMotion: boolean | null,
  pulseTransition: Record<string, unknown>,
) {
  return pages.map((_, i) =>
    i === activePageIndex ? (
      <motion.span
        key={`dot-active-${i}-${pulseEpoch}`}
        className="block h-1.5 w-1.5 rounded-full bg-white shadow-sm"
        initial={{ scale: 1 }}
        animate={reduceMotion ? { scale: 1 } : { scale: [1, 1.28, 1] }}
        transition={reduceMotion ? { duration: 0 } : pulseTransition}
      />
    ) : (
      <span key={`dot-${i}`} className="h-1.5 w-1.5 rounded-full bg-white/45" />
    ),
  );
}
