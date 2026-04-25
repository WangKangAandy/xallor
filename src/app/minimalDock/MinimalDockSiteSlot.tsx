import type { KeyboardEvent, MouseEvent } from "react";
import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { useGridItemContextMenu } from "../components/useGridItemContextMenu";
import { FaviconIcon } from "../components/shared/FaviconIcon";
import { openExternalUrlImpl, useOpenExternalUrl } from "../navigation";
import type { MinimalDockSiteEntry } from "./minimalDockTypes";
import { MINIMAL_DOCK_SITE_DRAG_TYPE, type MinimalDockSiteDragItem } from "./minimalDockDnDTypes";

export type MinimalDockSiteSlotProps = {
  entry: MinimalDockSiteEntry;
  index: number;
  slotClassName: string;
  onReorder: (fromIndex: number, toIndex: number) => void;
  isCustomContextMenuEnabled: boolean;
  onDockSiteDelete?: (dockEntryId: string) => void;
  onDockSiteHide?: (dockEntryId: string) => void | Promise<void>;
  onDockEnterArrangeMode?: () => void;
};

/**
 * Dock 单个站点槽：与网格站点共用右键菜单；拖拽排序使用 react-dnd（极简布局下无外层 DnDProvider，
 * 由 AppMinimalDockLayer 在 Dock 区域单独提供 Provider）。原生 draggable 在 Chromium 上易与右键菜单冲突。
 */
export function MinimalDockSiteSlot({
  entry,
  index,
  slotClassName,
  onReorder,
  isCustomContextMenuEnabled,
  onDockSiteDelete,
  onDockSiteHide,
  onDockEnterArrangeMode,
}: MinimalDockSiteSlotProps) {
  const openUrl = useOpenExternalUrl();
  const ref = useRef<HTMLDivElement>(null);
  const { onContextMenu: rawContextMenu, portal } = useGridItemContextMenu(
    entry.id,
    onDockSiteDelete,
    onDockSiteHide ? (id) => void onDockSiteHide(id) : undefined,
    onDockEnterArrangeMode,
    () => openExternalUrlImpl(entry.site.url, { openInNewTab: false }),
    () => openExternalUrlImpl(entry.site.url, { openInNewTab: true }),
  );
  const onContextMenu = isCustomContextMenuEnabled ? rawContextMenu : undefined;

  const [{ isDragging }, drag] = useDrag({
    type: MINIMAL_DOCK_SITE_DRAG_TYPE,
    item: (): MinimalDockSiteDragItem => ({
      type: MINIMAL_DOCK_SITE_DRAG_TYPE,
      index,
      id: entry.id,
    }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [, drop] = useDrop({
    accept: MINIMAL_DOCK_SITE_DRAG_TYPE,
    drop: (dragged: MinimalDockSiteDragItem) => {
      if (dragged.index === index) return;
      onReorder(dragged.index, index);
    },
  });

  drag(drop(ref));

  return (
    <>
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        data-testid="minimal-dock-site-slot"
        data-dock-site-id={entry.id}
        data-context-entity="true"
        data-context-entity-type="dock-site"
        aria-label={entry.site.name}
        onClick={(e: MouseEvent<HTMLDivElement>) => openUrl(entry.site.url, e)}
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openUrl(entry.site.url, e);
          }
        }}
        onContextMenu={onContextMenu}
        className={`${slotClassName} ${isDragging ? "opacity-45" : ""} cursor-grab active:cursor-grabbing outline-none focus-visible:ring-2 focus-visible:ring-white/50`}
      >
        <FaviconIcon domain={entry.site.domain} name={entry.site.name} size={40} />
      </div>
      {portal}
    </>
  );
}
