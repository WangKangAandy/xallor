import { buildFolderGridChrome } from "./buildFolderGridChrome";
import type { FolderItem } from "./desktopGridTypes";
import { DesktopGridItemFolderBody } from "./DesktopGridItemFolderBody";
import { GridItemCardFrame } from "./GridItemCardFrame";
import { type GridItemCardSharedCallbacks, useGridItemCard } from "./useGridItemCard";

export type GridFolderCardProps = GridItemCardSharedCallbacks & {
  item: FolderItem;
  index: number;
  showLabels?: boolean;
  onRename?: (id: string, newName: string) => void;
  onOpenFolder?: (id: string) => void;
  onDeleteItem?: (id: string) => void;
};

export function GridFolderCard({ item, index, showLabels = true, onRename, onOpenFolder, onDeleteItem, ...callbacks }: GridFolderCardProps) {
  const shell = useGridItemCard(item, index, callbacks);
  const { renderSize, folderResize } = shell;
  const { resizePreview, activeResizeDir, resizeFolderPending, resizeFolderStartRef } = folderResize;

  const folderChrome = buildFolderGridChrome({
    item,
    renderSize,
    resizePreview,
    resizeFolderStartRef,
    resizeFolderPending,
    activeResizeDir,
  });

  return (
    <GridItemCardFrame {...shell} itemId={item.id} onDeleteItem={onDeleteItem}>
      <DesktopGridItemFolderBody
        item={item}
        isMergeTarget={callbacks.isMergeTarget}
        showLabels={showLabels}
        chrome={folderChrome}
        onRename={(newName) => onRename?.(item.id, newName)}
        onOpenFolder={() => onOpenFolder?.(item.id)}
      />
    </GridItemCardFrame>
  );
}
