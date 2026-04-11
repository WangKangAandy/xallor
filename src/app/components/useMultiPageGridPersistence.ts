import { useCallback, useEffect, useReducer } from "react";
import type { GridItemType } from "./desktopGridTypes";
import type { GridPagePayload, MultiPageGridState } from "../storage/types";
import { loadMultiPageGridState, saveMultiPageGridState } from "../storage/repository";
import { emptyGridPagePayload } from "./desktopGridInitialItems";

const SAVE_DEBOUNCE_MS = 400;

type State = MultiPageGridState & { isHydrated: boolean };

type Action =
  | { type: "hydrate"; payload: MultiPageGridState }
  | { type: "updateItems"; pageId: string; updater: React.SetStateAction<GridItemType[]> }
  | { type: "wheelNext" }
  | { type: "wheelPrev" };

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
        return { ...p, items: nextItems };
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

/** 与 `wheelNext` 分支一致：能否前进/在末页新建下一页（末页为空则为 false）。 */
export function canWheelNextPage(pages: GridPagePayload[], activePageIndex: number): boolean {
  if (pages.length === 0) return false;
  if (activePageIndex < pages.length - 1) return true;
  const current = pages[activePageIndex];
  return (current?.items.length ?? 0) > 0;
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

  const goNextPage = useCallback(() => dispatch({ type: "wheelNext" }), []);
  const goPrevPage = useCallback(() => dispatch({ type: "wheelPrev" }), []);

  return {
    pages,
    activePageIndex,
    isHydrated,
    setPageItems,
    goNextPage,
    goPrevPage,
  };
}
