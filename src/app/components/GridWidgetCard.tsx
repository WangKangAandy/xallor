import type { WidgetItem } from "./desktopGridTypes";
import { DesktopGridItemWidgetBody } from "./DesktopGridItemWidgetBody";
import { GridItemCardFrame } from "./GridItemCardFrame";
import { type GridItemCardSharedCallbacks, useGridItemCard } from "./useGridItemCard";

export type GridWidgetCardProps = GridItemCardSharedCallbacks & {
  item: WidgetItem;
  index: number;
};

export function GridWidgetCard({ item, index, ...callbacks }: GridWidgetCardProps) {
  const shell = useGridItemCard(item, index, callbacks);

  return (
    <GridItemCardFrame {...shell}>
      <DesktopGridItemWidgetBody widgetType={item.widgetType} />
    </GridItemCardFrame>
  );
}
