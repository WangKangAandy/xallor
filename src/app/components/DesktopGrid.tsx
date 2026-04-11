import React, { useCallback, useState } from "react";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DesktopGridItem } from "./DesktopGridItem";
import { DesktopGridFolderPortal } from "./DesktopGridFolderPortal";
import type { GridItemType, GridShape, FolderItem } from "./desktopGridTypes";
import type { GridDnDDragItem } from "./desktopGridDnDTypes";
import { GRID_CELL_SIZE, GRID_GAP } from "./desktopGridConstants";
import { useGridDnD } from "./useGridDnD";

export type DesktopGridProps = {
  items: GridItemType[];
  setItems: React.Dispatch<React.SetStateAction<GridItemType[]>>;
  showLabels: boolean;
  isHydrated: boolean;
};

function GridDropZone({ onDropEmpty, children }: { onDropEmpty: (item: unknown) => void; children: React.ReactNode }) {
  const [, drop] = useDrop({
    accept: "ITEM",
    drop: (item, monitor) => {
      if (monitor.didDrop()) return;
      onDropEmpty(item);
    },
  });

  return (
    <div ref={drop} className="w-full h-full min-h-[500px]">
      {children}
    </div>
  );
}

export function DesktopGrid({ items, setItems, showLabels, isHydrated }: DesktopGridProps) {
  const { mergeIntent, handleReorder, handleHoverMergeIntent, handleClearMergeIntent, handleDropItem } =
    useGridDnD(setItems);

  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [isFolderDragging, setIsFolderDragging] = useState(false);

  const handleRename = useCallback(
    (id: string, newName: string) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            if (item.type === "site") {
              return { ...item, site: { ...item.site, name: newName } };
            }
            if (item.type === "folder") {
              return { ...item, name: newName };
            }
          }
          return item;
        }),
      );
    },
    [setItems],
  );

  const handleRenameInnerItem = useCallback(
    (folderId: string, siteUrl: string, newName: string) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.type === "folder" && item.id === folderId) {
            return {
              ...item,
              sites: item.sites.map((site) => (site.url === siteUrl ? { ...site, name: newName } : site)),
            };
          }
          return item;
        }),
      );
    },
    [setItems],
  );

  const handleResize = useCallback(
    (id: string, newShape: GridShape) => {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, shape: newShape } : item)));
    },
    [setItems],
  );

  const openFolder = openFolderId ? (items.find((i) => i.id === openFolderId) as FolderItem | undefined) : undefined;

  // 网格项 z-index 数值见 desktopGridLayers.ts（DesktopGridItem inline style）
  return (
    <DndProvider backend={HTML5Backend}>
      <GridDropZone onDropEmpty={(item) => handleDropItem(item as GridDnDDragItem, "GRID_END", false)}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fit, ${GRID_CELL_SIZE}px)`,
            gridAutoRows: `${GRID_CELL_SIZE}px`,
            gap: `${GRID_GAP}px`,
            justifyContent: "center",
            gridAutoFlow: "dense",
            paddingBottom: "100px",
            width: "100%",
            margin: "0 auto",
            transition: "gap 0.3s ease-in-out",
          }}
        >
          {isHydrated &&
            items.map((item, i) => (
              <DesktopGridItem
                key={item.id}
                item={item}
                index={i}
                onReorder={handleReorder}
                onHoverMergeIntent={handleHoverMergeIntent}
                onClearMergeIntent={handleClearMergeIntent}
                onDropItem={handleDropItem}
                isMergeTarget={mergeIntent?.targetId === item.id && mergeIntent?.draggedId !== item.id}
                onResize={handleResize}
                onOpenFolder={(id) => setOpenFolderId(id)}
                showLabels={showLabels}
                onRename={handleRename}
              />
            ))}
        </div>
      </GridDropZone>

      {openFolder && (
        <DesktopGridFolderPortal
          folder={openFolder}
          showLabels={showLabels}
          isFolderDragging={isFolderDragging}
          onClose={() => setOpenFolderId(null)}
          onRenameFolder={(newName) => handleRename(openFolder.id, newName)}
          onRenameInnerSite={(siteUrl, newName) => handleRenameInnerItem(openFolder.id, siteUrl, newName)}
          onInnerDragStart={() => setIsFolderDragging(true)}
          onInnerDragEnd={() => {
            setIsFolderDragging(false);
            setOpenFolderId(null);
          }}
        />
      )}
    </DndProvider>
  );
}
