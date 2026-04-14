import { GridFolderCard } from "../GridFolderCard";
import { GridSiteCard } from "../GridSiteCard";
import { GridWidgetCard } from "../GridWidgetCard";
import type { DesktopGridItemProps } from "../DesktopGridItem";
import type { GridItemType } from "../desktopGridTypes";
import { tryGetWidgetDefinition } from "./widgetRegistry";

export type GridRenderableKind = "site" | "folder" | "widget";

/**
 * 阶段 C（第一步）：统一网格项渲染入口，逐步从类型分支切换为 registry 驱动。
 * 当前先保持与既有三类卡片一致，避免一次性改动渲染实现。
 */
export function getGridRenderableKind(item: GridItemType): GridRenderableKind {
  return item.type;
}

export function canRenderWidgetInGrid(widgetType: string): boolean {
  return Boolean(tryGetWidgetDefinition(widgetType));
}

export function WidgetRenderer(props: DesktopGridItemProps) {
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
    onEnterArrangeMode,
    isArrangeMode,
    isArrangeSelected,
    onArrangeToggleSelect,
  } = props;

  const shared = {
    onReorder,
    onHoverMergeIntent,
    onClearMergeIntent,
    onDropItem,
    isMergeTarget,
    onResize,
  };

  const kind = getGridRenderableKind(item);
  if (kind === "site" && item.type === "site") {
    return (
      <GridSiteCard
        item={item}
        index={index}
        showLabels={showLabels}
        onRename={onRename}
        onDeleteItem={onDeleteItem}
        onEnterArrangeMode={onEnterArrangeMode}
        isArrangeMode={isArrangeMode}
        isArrangeSelected={isArrangeSelected}
        onArrangeToggleSelect={onArrangeToggleSelect}
        {...shared}
      />
    );
  }
  if (kind === "folder" && item.type === "folder") {
    return (
      <GridFolderCard
        item={item}
        index={index}
        showLabels={showLabels}
        onRename={onRename}
        onOpenFolder={onOpenFolder}
        onDeleteItem={onDeleteItem}
        onEnterArrangeMode={onEnterArrangeMode}
        isArrangeMode={isArrangeMode}
        isArrangeSelected={isArrangeSelected}
        onArrangeToggleSelect={onArrangeToggleSelect}
        {...shared}
      />
    );
  }
  if (kind === "widget" && item.type === "widget") {
    if (!canRenderWidgetInGrid(item.widgetType)) {
      return null;
    }
    return (
      <GridWidgetCard
        item={item}
        index={index}
        onDeleteItem={onDeleteItem}
        onEnterArrangeMode={onEnterArrangeMode}
        isArrangeMode={isArrangeMode}
        isArrangeSelected={isArrangeSelected}
        onArrangeToggleSelect={onArrangeToggleSelect}
        {...shared}
      />
    );
  }
  // 保底返回 null，防止异常数据导致整个网格崩溃。
  return null;
}

