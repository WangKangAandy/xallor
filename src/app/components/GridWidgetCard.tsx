import type { WidgetItem } from "./desktopGridTypes";
import { DesktopGridItemWidgetBody } from "./DesktopGridItemWidgetBody";
import { GridItemCardFrame } from "./GridItemCardFrame";
import { type GridItemCardSharedCallbacks, useGridItemCard } from "./useGridItemCard";

export type GridWidgetCardProps = GridItemCardSharedCallbacks & {
  item: WidgetItem;
  index: number;
  onDeleteItem?: (id: string) => void;
};

export function GridWidgetCard({ item, index, onDeleteItem, ...callbacks }: GridWidgetCardProps) {
  const shell = useGridItemCard(item, index, callbacks);

  return (
    <GridItemCardFrame {...shell} itemId={item.id} onDeleteItem={onDeleteItem}>
      <DesktopGridItemWidgetBody widgetType={item.widgetType} />
    </GridItemCardFrame>
  );
}
