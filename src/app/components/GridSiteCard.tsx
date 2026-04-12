import type { SiteItem } from "./desktopGridTypes";
import { DesktopGridItemSiteBody } from "./DesktopGridItemSiteBody";
import { GridItemCardFrame } from "./GridItemCardFrame";
import { type GridItemCardSharedCallbacks, useGridItemCard } from "./useGridItemCard";

export type GridSiteCardProps = GridItemCardSharedCallbacks & {
  item: SiteItem;
  index: number;
  showLabels?: boolean;
  onRename?: (id: string, newName: string) => void;
  onDeleteItem?: (id: string) => void;
};

export function GridSiteCard({ item, index, showLabels = true, onRename, onDeleteItem, ...callbacks }: GridSiteCardProps) {
  const shell = useGridItemCard(item, index, callbacks);

  return (
    <GridItemCardFrame {...shell} itemId={item.id} onDeleteItem={onDeleteItem}>
      <DesktopGridItemSiteBody
        item={item}
        isMergeTarget={callbacks.isMergeTarget}
        showLabels={showLabels}
        onRename={(newName) => onRename?.(item.id, newName)}
      />
    </GridItemCardFrame>
  );
}
