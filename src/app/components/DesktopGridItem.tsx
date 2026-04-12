import type { GridItemType, GridShape } from "./desktopGridTypes";
import type { GridDnDDragItem } from "./desktopGridDnDTypes";
import { GridFolderCard } from "./GridFolderCard";
import { GridSiteCard } from "./GridSiteCard";
import { GridWidgetCard } from "./GridWidgetCard";

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
  /** 站点卡片：打开「添加图标」模块时带上上下文站点 id（由 DesktopGrid 注入）。 */
  onRequestAddSite?: (siteId: string) => void;
}

export function DesktopGridItem(props: DesktopGridItemProps) {
  const {
    item,
    index,
    onReorder,
    onHoverMergeIntent,
    onClearMergeIntent,
    onDropItem,
    isMergeTarget,
    onResize,
    onOpenFolder,
    showLabels,
    onRename,
    onDeleteItem,
    onRequestAddSite,
  } = props;

  const shared = {
    onReorder,
    onHoverMergeIntent,
    onClearMergeIntent,
    onDropItem,
    isMergeTarget,
    onResize,
  };

  if (item.type === "site") {
    return (
      <GridSiteCard
        item={item}
        index={index}
        showLabels={showLabels}
        onRename={onRename}
        onDeleteItem={onDeleteItem}
        onRequestAddSite={onRequestAddSite}
        {...shared}
      />
    );
  }
  if (item.type === "folder") {
    return (
      <GridFolderCard
        item={item}
        index={index}
        showLabels={showLabels}
        onRename={onRename}
        onOpenFolder={onOpenFolder}
        onDeleteItem={onDeleteItem}
        {...shared}
      />
    );
  }
  return <GridWidgetCard item={item} index={index} onDeleteItem={onDeleteItem} {...shared} />;
}
