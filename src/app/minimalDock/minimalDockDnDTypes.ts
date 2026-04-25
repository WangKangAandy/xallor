export const MINIMAL_DOCK_SITE_DRAG_TYPE = "MINIMAL_DOCK_SITE" as const;

export type MinimalDockSiteDragItem = {
  type: typeof MINIMAL_DOCK_SITE_DRAG_TYPE;
  index: number;
  id: string;
};
