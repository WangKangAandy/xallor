import type { GridItemType, GridShape } from "./desktopGridTypes";
import type { GridDnDDragItem } from "./desktopGridDnDTypes";
import { WidgetRenderer } from "./widgets/WidgetRenderer";

export { Favicon, EditableLabel } from "./DesktopGridItemPrimitives";
export type { GridSiteCardProps } from "./GridSiteCard";
export type { GridFolderCardProps } from "./GridFolderCard";
export type { GridWidgetCardProps } from "./GridWidgetCard";

export interface DesktopGridItemProps {
  item: GridItemType;
  onReorder: (draggedId: string, hoverId: string) => void;
  onHoverMergeIntent: (hoverId: string, draggedId: string) => void;
  onClearMergeIntent: (id?: string) => void;
  onDropItem: (draggedItem: GridDnDDragItem, hoverId: string, inCenterZone?: boolean) => void;
  isMergeTarget: boolean;
  onResize: (id: string, newShape: GridShape) => void;
  onOpenFolder?: (id: string) => void;
  index: number;
  showLabels?: boolean;
  onRename?: (id: string, newName: string) => void;
  /** 右键菜单等：从当前页移除该图标。 */
  onDeleteItem?: (id: string) => void;
  onEnterArrangeMode?: () => void;
  isArrangeMode?: boolean;
  isArrangeSelected?: boolean;
  onArrangeToggleSelect?: () => void;
}

export function DesktopGridItem(props: DesktopGridItemProps) {
  return <WidgetRenderer {...props} />;
}
