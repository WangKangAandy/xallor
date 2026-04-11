import { useEffect, useRef } from "react";
import type { GridPagePayload } from "../storage/types";
import { canWheelNextPage } from "./useMultiPageGridPersistence";
import { WHEEL_COOLDOWN_MS, WHEEL_DELTA_MIN } from "./multiDesktopStripConstants";

type Params = {
  isHydrated: boolean;
  pages: GridPagePayload[];
  activePageIndex: number;
  goNextPage: () => void;
  goPrevPage: () => void;
  /** 末页为空仍向下滚：不翻页，由指示层给出反馈 */
  onWheelReject: () => void;
};

/**
 * 桌面条带区域：纵向滚轮切页；`passive: false` 以便 `preventDefault`。
 */
export function useDesktopStripWheel({
  isHydrated,
  pages,
  activePageIndex,
  goNextPage,
  goPrevPage,
  onWheelReject,
}: Params) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const lastWheelAt = useRef(0);

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
          onWheelReject();
          return;
        }
        goNextPage();
      } else {
        goPrevPage();
      }
    };
    el.addEventListener("wheel", handler, passiveFalse);
    return () => el.removeEventListener("wheel", handler);
  }, [isHydrated, goNextPage, goPrevPage, pages, activePageIndex, onWheelReject]);

  return viewportRef;
}
