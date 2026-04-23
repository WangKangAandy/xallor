import { useDrop } from "react-dnd";
import type { ReactNode } from "react";

type DesktopGridDropZoneProps = {
  onDropEmpty: (item: unknown) => void;
  gridId?: string;
  onDropZoneRef?: (el: HTMLDivElement | null) => void;
  children: ReactNode;
};

/**
 * 桌面网格最外层 DnD 落点：与 `react-dnd` 的 `useDrop` 绑定，供 `DesktopGrid` 专用。
 */
export function DesktopGridDropZone({ onDropEmpty, gridId, onDropZoneRef, children }: DesktopGridDropZoneProps) {
  const [, drop] = useDrop({
    accept: "ITEM",
    drop: (item, monitor) => {
      if (monitor.didDrop()) return;
      onDropEmpty(item);
    },
  });

  return (
    <div
      data-testid="desktop-grid-dropzone"
      data-arrange-grid-id={gridId}
      ref={(node) => {
        drop(node);
        onDropZoneRef?.(node);
      }}
      className="h-full min-h-[500px] w-full"
    >
      {children}
    </div>
  );
}
