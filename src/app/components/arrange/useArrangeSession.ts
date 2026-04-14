import { useCallback, useMemo, useReducer } from "react";
import {
  ARRANGE_SESSION_INITIAL_STATE,
  type ArrangeItemId,
  type ArrangeSelectionRect,
  type ArrangeSessionState,
} from "./arrangeTypes";

export type ArrangeSessionAction =
  | { type: "enter"; activePageId: string }
  | { type: "exit" }
  | { type: "toggleSelect"; id: ArrangeItemId }
  | { type: "setManySelected"; ids: ArrangeItemId[]; selected: boolean }
  | { type: "clearSelection" }
  | { type: "setSelecting"; value: boolean }
  | { type: "setSelectionRect"; rect: ArrangeSelectionRect | null }
  | { type: "startBatchDrag"; ids: ArrangeItemId[] }
  | { type: "endBatchDrag" }
  | { type: "setTrashZoneActive"; value: boolean }
  | { type: "setActivePageId"; pageId: string };

export function arrangeSessionReducer(state: ArrangeSessionState, action: ArrangeSessionAction): ArrangeSessionState {
  switch (action.type) {
    case "enter":
      return {
        ...state,
        isArrangeMode: true,
        stage: "browse",
        selectedIds: new Set<ArrangeItemId>(),
        draggingIds: [],
        isSelecting: false,
        selectionRect: null,
        trashZoneActive: false,
        activePageId: action.activePageId,
      };
    case "exit":
      return { ...ARRANGE_SESSION_INITIAL_STATE };
    case "toggleSelect": {
      if (!state.isArrangeMode) return state;
      const next = new Set(state.selectedIds);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { ...state, selectedIds: next };
    }
    case "setManySelected": {
      if (!state.isArrangeMode) return state;
      const next = new Set(state.selectedIds);
      for (const id of action.ids) {
        if (action.selected) next.add(id);
        else next.delete(id);
      }
      return { ...state, selectedIds: next };
    }
    case "clearSelection":
      if (!state.isArrangeMode) return state;
      return { ...state, selectedIds: new Set<ArrangeItemId>() };
    case "setSelecting":
      if (!state.isArrangeMode) return state;
      return {
        ...state,
        isSelecting: action.value,
        stage: action.value ? "selecting" : state.draggingIds.length > 0 ? "dragging-batch" : "browse",
      };
    case "setSelectionRect":
      if (!state.isArrangeMode) return state;
      return { ...state, selectionRect: action.rect };
    case "startBatchDrag":
      if (!state.isArrangeMode) return state;
      return { ...state, draggingIds: action.ids, stage: action.ids.length > 0 ? "dragging-batch" : "browse" };
    case "endBatchDrag":
      if (!state.isArrangeMode) return state;
      return { ...state, draggingIds: [], stage: state.isSelecting ? "selecting" : "browse", trashZoneActive: false };
    case "setTrashZoneActive":
      if (!state.isArrangeMode) return state;
      return { ...state, trashZoneActive: action.value };
    case "setActivePageId":
      if (!state.isArrangeMode) return state;
      return { ...state, activePageId: action.pageId, stage: "page-transition" };
    default:
      return state;
  }
}

export function useArrangeSession() {
  const [state, dispatch] = useReducer(arrangeSessionReducer, ARRANGE_SESSION_INITIAL_STATE);

  const enterArrangeMode = useCallback((activePageId: string) => dispatch({ type: "enter", activePageId }), []);
  const exitArrangeMode = useCallback(() => dispatch({ type: "exit" }), []);
  const toggleSelect = useCallback((id: ArrangeItemId) => dispatch({ type: "toggleSelect", id }), []);
  const setManySelected = useCallback(
    (ids: ArrangeItemId[], selected: boolean) => dispatch({ type: "setManySelected", ids, selected }),
    [],
  );
  const clearSelection = useCallback(() => dispatch({ type: "clearSelection" }), []);
  const setSelecting = useCallback((value: boolean) => dispatch({ type: "setSelecting", value }), []);
  const setSelectionRect = useCallback((rect: ArrangeSelectionRect | null) => dispatch({ type: "setSelectionRect", rect }), []);
  const startBatchDrag = useCallback((ids: ArrangeItemId[]) => dispatch({ type: "startBatchDrag", ids }), []);
  const endBatchDrag = useCallback(() => dispatch({ type: "endBatchDrag" }), []);
  const setTrashZoneActive = useCallback((value: boolean) => dispatch({ type: "setTrashZoneActive", value }), []);
  const setActivePageId = useCallback((pageId: string) => dispatch({ type: "setActivePageId", pageId }), []);

  return useMemo(
    () => ({
      state,
      enterArrangeMode,
      exitArrangeMode,
      toggleSelect,
      setManySelected,
      clearSelection,
      setSelecting,
      setSelectionRect,
      startBatchDrag,
      endBatchDrag,
      setTrashZoneActive,
      setActivePageId,
    }),
    [
      state,
      enterArrangeMode,
      exitArrangeMode,
      toggleSelect,
      setManySelected,
      clearSelection,
      setSelecting,
      setSelectionRect,
      startBatchDrag,
      endBatchDrag,
      setTrashZoneActive,
      setActivePageId,
    ],
  );
}

