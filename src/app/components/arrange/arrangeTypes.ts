export type ArrangeItemId = string;

export type ArrangeSelectionRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type ArrangeModeStage = "idle" | "browse" | "selecting" | "dragging-batch" | "page-transition";

export type ArrangeSessionState = {
  isArrangeMode: boolean;
  stage: ArrangeModeStage;
  selectedIds: Set<ArrangeItemId>;
  draggingIds: ArrangeItemId[];
  isSelecting: boolean;
  selectionRect: ArrangeSelectionRect | null;
  trashZoneActive: boolean;
  activePageId: string | null;
};

export const ARRANGE_SESSION_INITIAL_STATE: ArrangeSessionState = {
  isArrangeMode: false,
  stage: "idle",
  selectedIds: new Set<ArrangeItemId>(),
  draggingIds: [],
  isSelecting: false,
  selectionRect: null,
  trashZoneActive: false,
  activePageId: null,
};

