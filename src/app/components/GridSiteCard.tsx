import type { SiteItem } from "./desktopGridTypes";
import { DesktopGridItemSiteBody } from "./DesktopGridItemSiteBody";
import { GridItemCardFrame } from "./GridItemCardFrame";
import { type GridItemCardSharedCallbacks, useGridItemCard } from "./useGridItemCard";
import { openExternalUrlImpl } from "../navigation";

export type GridSiteCardProps = GridItemCardSharedCallbacks & {
  item: SiteItem;
  index: number;
  showLabels?: boolean;
  onRename?: (id: string, newName: string) => void;
  onDeleteItem?: (id: string) => void;
  onHideItem?: (id: string) => void;
  onEnterArrangeMode?: () => void;
  isArrangeMode?: boolean;
  isArrangeSelected?: boolean;
  onArrangeToggleSelect?: () => void;
};

export function GridSiteCard({ item, index, showLabels = true, onRename, onDeleteItem, onHideItem, ...callbacks }: GridSiteCardProps) {
  const shell = useGridItemCard(item, index, callbacks);

  return (
    <GridItemCardFrame
      {...shell}
      itemId={item.id}
      onDeleteItem={onDeleteItem}
      onHideItem={onHideItem}
      onOpenInCurrentWindow={() => openExternalUrlImpl(item.site.url, { openInNewTab: false })}
      onOpenInNewWindow={() => openExternalUrlImpl(item.site.url, { openInNewTab: true })}
      isArrangeMode={callbacks.isArrangeMode}
      isArrangeSelected={callbacks.isArrangeSelected}
      onArrangeToggleSelect={callbacks.onArrangeToggleSelect}
    >
      <DesktopGridItemSiteBody
        item={item}
        isMergeTarget={callbacks.isMergeTarget}
        isArrangeMode={Boolean(callbacks.isArrangeMode)}
        isArrangeSelected={Boolean(callbacks.isArrangeSelected)}
        showLabels={showLabels}
        onRename={(newName) => onRename?.(item.id, newName)}
      />
    </GridItemCardFrame>
  );
}
