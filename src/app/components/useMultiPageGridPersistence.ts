import { useCallback, useEffect, useReducer, useRef } from "react";
import type { GridItemType } from "./desktopGridTypes";
import type { MultiPageGridState } from "../storage/types";
import { loadMultiPageGridState, saveMultiPageGridState } from "../storage/repository";
import { emptyGridPayload } from "./desktopGridInitialItems";

const SAVE_DEBOUNCE_MS = 400;

type State = MultiPageGridState & { isHydrated: boolean };

type Action =
  | { type: "hydrate"; payload: MultiPageGridState }
  | { type: "updateItems"; pageIndex: number; updater: React.SetStateAction<GridItemType[]> }
  | { type: "wheelNext" }
  | { type: "wheelPrev" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...action.payload, isHydrated: true };
    case "updateItems": {
      const { pageIndex, updater } = action;
      const pages = state.pages.map((p, i) => {
        if (i !== pageIndex) return p;
        const nextItems = typeof updater === "function" ? updater(p.items) : updater;
        return { ...p, items: nextItems };
      });
      return { ...state, pages };
    }
    case "wheelNext": {
      const { activePageIndex, pages } = state;
      if (activePageIndex < pages.length - 1) {
        return { ...state, activePageIndex: activePageIndex + 1 };
      }
      return {
        ...state,
        pages: [...pages, emptyGridPayload()],
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

export function useMultiPageGridPersistence(fallback: MultiPageGridState) {
  const [state, dispatch] = useReducer(reducer, {
    ...fallback,
    isHydrated: false,
  } as State);

  const hydratedForSave = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const loaded = await loadMultiPageGridState(fallback);
      if (cancelled) return;
      dispatch({ type: "hydrate", payload: loaded });
      hydratedForSave.current = true;
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

  const setPageItems = useCallback((pageIndex: number, updater: React.SetStateAction<GridItemType[]>) => {
    dispatch({ type: "updateItems", pageIndex, updater });
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
