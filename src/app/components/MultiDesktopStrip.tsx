import React, { useEffect, useRef } from "react";
import type { MultiPageGridState } from "../storage/types";
import { DEFAULT_GRID_PAYLOAD } from "./desktopGridInitialItems";
import { DesktopGrid } from "./DesktopGrid";
import { useMultiPageGridPersistence } from "./useMultiPageGridPersistence";

const FALLBACK: MultiPageGridState = {
  pages: [DEFAULT_GRID_PAYLOAD],
  activePageIndex: 0,
};

const WHEEL_COOLDOWN_MS = 450;
const WHEEL_DELTA_MIN = 8;

/**
 * 横向多桌面：在桌面区域纵向滚轮向下 → 下一页（到末页则新建空白页）；向上 → 上一页。
 * 搜索栏在 App 中单独挂载，不在此条带内。
 */
export function MultiDesktopStrip() {
  const { pages, activePageIndex, isHydrated, setPageItems, goNextPage, goPrevPage } =
    useMultiPageGridPersistence(FALLBACK);

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
      if (ev.deltaY > 0) goNextPage();
      else goPrevPage();
    };
    el.addEventListener("wheel", handler, passiveFalse);
    return () => el.removeEventListener("wheel", handler);
  }, [isHydrated, goNextPage, goPrevPage]);

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

      {pages.length > 1 && (
        <div
          className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/20 px-2 py-1 text-[10px] text-white/80 backdrop-blur-sm"
          aria-hidden
        >
          {pages.map((_, i) => (
            <span
              key={`dot-${i}`}
              className={`h-1.5 w-1.5 rounded-full ${i === activePageIndex ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
