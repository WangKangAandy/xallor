import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { GridPagePayload } from "../storage/types";
import { DESKTOP_SLIDE_MS, DOTS_AUTO_HIDE_MS } from "./multiDesktopStripConstants";

/**
 * 多桌面底部圆点指示条：显隐、切页脉冲、单页时「拒绝新建」反馈（与切页共用 pulseEpoch）。
 */
export function useDesktopPageIndicator(
  isHydrated: boolean,
  pages: GridPagePayload[],
  activePageIndex: number,
) {
  const reduceMotion = useReducedMotion();
  const prevActiveRef = useRef<number | null>(null);
  const prevPageCountRef = useRef(0);

  const [dotsVisible, setDotsVisible] = useState(false);
  const [pulseEpoch, setPulseEpoch] = useState(0);
  /** 仅用于「仅有一页时仍要展示圆点条」的闸门（拒绝新建时递增） */
  const [singlePageIndicatorEpoch, setSinglePageIndicatorEpoch] = useState(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleDotsAutoHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setDotsVisible(false);
      setSinglePageIndicatorEpoch(0);
      hideTimerRef.current = null;
    }, DOTS_AUTO_HIDE_MS);
  }, [clearHideTimer]);

  useEffect(() => {
    return () => clearHideTimer();
  }, [clearHideTimer]);

  useEffect(() => {
    if (prevPageCountRef.current > 1 && pages.length === 1) {
      clearHideTimer();
      setDotsVisible(false);
      setSinglePageIndicatorEpoch(0);
    }
    prevPageCountRef.current = pages.length;
  }, [pages.length, clearHideTimer]);

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
      setSinglePageIndicatorEpoch(0);
      setPulseEpoch((n) => n + 1);
      setDotsVisible(true);
      scheduleDotsAutoHide();
    }
  }, [activePageIndex, isHydrated, pages.length, clearHideTimer, scheduleDotsAutoHide]);

  const stripTransition = reduceMotion
    ? { duration: 0.2 }
    : { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.85 };

  const pulseTransition = reduceMotion
    ? { duration: 0 }
    : {
        delay: DESKTOP_SLIDE_MS / 1000,
        duration: 0.42,
        times: [0, 0.42, 1],
        ease: [0.22, 1, 0.36, 1],
      };

  const showDotsPill =
    dotsVisible &&
    pages.length >= 1 &&
    (pages.length > 1 || singlePageIndicatorEpoch > 0);

  const triggerRejectFeedback = useCallback(() => {
    clearHideTimer();
    setSinglePageIndicatorEpoch((g) => g + 1);
    setPulseEpoch((n) => n + 1);
    setDotsVisible(true);
    scheduleDotsAutoHide();
  }, [clearHideTimer, scheduleDotsAutoHide]);

  return {
    showDotsPill,
    pulseEpoch,
    pulseTransition,
    stripTransition,
    reduceMotion,
    triggerRejectFeedback,
  };
}
