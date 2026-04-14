import type { WidgetItem } from "./desktopGridTypes";
import { DesktopGridItemWidgetBody } from "./DesktopGridItemWidgetBody";
import { GridItemCardFrame } from "./GridItemCardFrame";
import { type GridItemCardSharedCallbacks, useGridItemCard } from "./useGridItemCard";

export type GridWidgetCardProps = GridItemCardSharedCallbacks & {
  item: WidgetItem;
  index: number;
  onDeleteItem?: (id: string) => void;
  onEnterArrangeMode?: () => void;
  isArrangeMode?: boolean;
  isArrangeSelected?: boolean;
  onArrangeToggleSelect?: () => void;
};

export function GridWidgetCard({ item, index, onDeleteItem, ...callbacks }: GridWidgetCardProps) {
  const shell = useGridItemCard(item, index, callbacks);

  return (
    <GridItemCardFrame
      {...shell}
      itemId={item.id}
      onDeleteItem={onDeleteItem}
      isArrangeMode={callbacks.isArrangeMode}
      isArrangeSelected={callbacks.isArrangeSelected}
      onArrangeToggleSelect={callbacks.onArrangeToggleSelect}
    >
      <DesktopGridItemWidgetBody
        widgetType={item.widgetType}
        isArrangeMode={Boolean(callbacks.isArrangeMode)}
        isArrangeSelected={Boolean(callbacks.isArrangeSelected)}
      />
    </GridItemCardFrame>
  );
}
