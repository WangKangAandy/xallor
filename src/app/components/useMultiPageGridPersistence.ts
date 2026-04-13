import { useCallback, useEffect, useReducer } from "react";
import type { GridItemType } from "./desktopGridTypes";
import type { GridPagePayload, MultiPageGridState } from "../storage/types";
import { type WidgetCompactionStrategy, type WidgetPageLayoutState } from "./widgets/layoutSchema";
import { MAX_DESKTOP_PAGES } from "../storage/multiPageLimits";
import { loadMultiPageGridState, saveMultiPageGridState } from "../storage/repository";
import { emptyGridPagePayload } from "./desktopGridInitialItems";

const SAVE_DEBOUNCE_MS = 400;

type State = MultiPageGridState & { isHydrated: boolean };

type Action =
  | { type: "hydrate"; payload: MultiPageGridState }
  | { type: "updateItems"; pageId: string; updater: React.SetStateAction<GridItemType[]> }
  | { type: "setPageWidgetLayout"; pageId: string; layout: WidgetPageLayoutState }
  | { type: "setPageCompactionStrategy"; pageId: string; strategy: WidgetCompactionStrategy }
  | { type: "setPageConflictStrategy"; pageId: string; strategy: "swap" | "reject" | "eject" }
  | { type: "wheelNext" }
  | { type: "wheelPrev" };

function syncWidgetLayoutMetadata(
  page: GridPagePayload,
  nextItems: GridItemType[],
): GridPagePayload {
  if (!page.widgetLayout) {
    return { ...page, items: nextItems };
  }
  const itemIdSet = new Set(nextItems.map((item) => item.id));
  return {
    ...page,
    items: nextItems,
    widgetLayout: {
      ...page.widgetLayout,
      // 单路径模式下，渲染与交互以 items 为唯一真相；widgets 仅做元数据镜像。
      widgets: nextItems.map((item) => item.id),
      // 清理已删除项的残留 layout 元数据，避免持久化脏引用。
      layout: page.widgetLayout.layout.filter((entry) => itemIdSet.has(entry.id)),
    },
  };
}

/** 导出供单元测试覆盖「空页不叠新页」等行为。 */
export function multiPageGridReducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...action.payload, isHydrated: true };
    case "updateItems": {
      const { pageId, updater } = action;
      let touched = false;
      const pages = state.pages.map((p) => {
        if (p.pageId !== pageId) return p;
        touched = true;
        const nextItems = typeof updater === "function" ? updater(p.items) : updater;
        return syncWidgetLayoutMetadata(p, nextItems);
      });
      if (!touched) return state;
      return { ...state, pages };
    }
    case "setPageWidgetLayout": {
      const { pageId, layout } = action;
      let touched = false;
      const pages = state.pages.map((p) => {
        if (p.pageId !== pageId) return p;
        touched = true;
        return { ...p, widgetLayout: layout };
      });
      if (!touched) return state;
      return { ...state, pages };
    }
    case "setPageCompactionStrategy": {
      const { pageId, strategy } = action;
      let touched = false;
      const pages = state.pages.map((p) => {
        if (p.pageId !== pageId) return p;
        touched = true;
        const nextLayout = p.widgetLayout
          ? { ...p.widgetLayout, compactionStrategy: strategy, autoCompactEnabled: strategy === "compact" }
          : { widgets: [], layout: [], compactionStrategy: strategy, autoCompactEnabled: strategy === "compact" };
        return { ...p, widgetLayout: nextLayout };
      });
      if (!touched) return state;
      return { ...state, pages };
    }
    case "setPageConflictStrategy": {
      const { pageId, strategy } = action;
      let touched = false;
      const pages = state.pages.map((p) => {
        if (p.pageId !== pageId) return p;
        touched = true;
        const nextLayout = p.widgetLayout
          ? { ...p.widgetLayout, conflictStrategy: strategy }
          : { widgets: [], layout: [], conflictStrategy: strategy };
        return { ...p, widgetLayout: nextLayout };
      });
      if (!touched) return state;
      return { ...state, pages };
    }
    case "wheelNext": {
      const { activePageIndex, pages } = state;
      if (activePageIndex < pages.length - 1) {
        return { ...state, activePageIndex: activePageIndex + 1 };
      }
      const current = pages[activePageIndex];
      // 当前页无任何图标时不再追加新桌面，避免滚轮无限叠空页
      if (!current || current.items.length === 0) {
        return state;
      }
      if (pages.length >= MAX_DESKTOP_PAGES) {
        return state;
      }
      return {
        ...state,
        pages: [...pages, emptyGridPagePayload()],
        activePageIndex: pages.length,
      };
    }
    case "wheelPrev":
      return {
        ...state,
        activePageIndex: Math.max(0, state.activePageIndex - 1),
      };
    default:
      return state;
  }
}

/** 与 `wheelNext` 分支一致：能否前进/在末页新建下一页（末页为空或已达页数上限则为 false）。 */
export function canWheelNextPage(pages: GridPagePayload[], activePageIndex: number): boolean {
  if (pages.length === 0) return false;
  if (activePageIndex < pages.length - 1) return true;
  const current = pages[activePageIndex];
  if ((current?.items.length ?? 0) === 0) return false;
  return pages.length < MAX_DESKTOP_PAGES;
}

/**
 * 阶段 B 并存能力：按 pageId 提供布局语义索引，供上层逐步接入而不改现有渲染链路。
 */
export function buildPageWidgetLayoutIndex(pages: GridPagePayload[]): Record<string, WidgetPageLayoutState | undefined> {
  return Object.fromEntries(pages.map((p) => [p.pageId, p.widgetLayout]));
}

/**
 * @param fallback 须为**稳定引用**（如模块级常量）；若每次 render 传入新对象会重复触发 hydrate。
 */
export function useMultiPageGridPersistence(fallback: MultiPageGridState) {
  const [state, dispatch] = useReducer(multiPageGridReducer, {
    ...fallback,
    isHydrated: false,
  } as State);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const loaded = await loadMultiPageGridState(fallback);
      if (cancelled) return;
      dispatch({ type: "hydrate", payload: loaded });
    })();
    return () => {
      cancelled = true;
    };
  }, [fallback]);

  const { pages, activePageIndex, isHydrated } = state;
  const widgetLayoutsByPageId = buildPageWidgetLayoutIndex(pages);

  useEffect(() => {
    if (!isHydrated) return;
    const timer = globalThis.setTimeout(() => {
      void saveMultiPageGridState({ pages, activePageIndex });
    }, SAVE_DEBOUNCE_MS);
    return () => globalThis.clearTimeout(timer);
  }, [pages, activePageIndex, isHydrated]);

  const setPageItems = useCallback((pageId: string, updater: React.SetStateAction<GridItemType[]>) => {
    dispatch({ type: "updateItems", pageId, updater });
  }, []);
  const setPageWidgetLayout = useCallback((pageId: string, layout: WidgetPageLayoutState) => {
    dispatch({ type: "setPageWidgetLayout", pageId, layout });
  }, []);
  const setPageAutoCompactEnabled = useCallback((pageId: string, enabled: boolean) => {
    dispatch({
      type: "setPageCompactionStrategy",
      pageId,
      strategy: enabled ? "compact" : "no-compact",
    });
  }, []);
  const setPageConflictStrategy = useCallback((pageId: string, strategy: "swap" | "reject" | "eject") => {
    dispatch({ type: "setPageConflictStrategy", pageId, strategy });
  }, []);

  const goNextPage = useCallback(() => dispatch({ type: "wheelNext" }), []);
  const goPrevPage = useCallback(() => dispatch({ type: "wheelPrev" }), []);

  return {
    pages,
    widgetLayoutsByPageId,
    activePageIndex,
    isHydrated,
    setPageItems,
    setPageWidgetLayout,
    setPageAutoCompactEnabled,
    setPageConflictStrategy,
    goNextPage,
    goPrevPage,
    getPageWidgetLayout: (pageId: string) => widgetLayoutsByPageId[pageId],
  };
}
