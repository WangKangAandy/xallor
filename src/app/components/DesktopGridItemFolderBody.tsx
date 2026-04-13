import type { CSSProperties } from "react";
import type { FolderItem, GridShape, Site } from "./desktopGridTypes";
import { DesktopGridFolderPreviewItem } from "./DesktopGridFolderPreviewItem";
import { GridDesktopCardSurface } from "./GridDesktopCardSurface";
import { GridItemLabel } from "./GridItemLabel";

export type FolderTileChrome = {
  viewportWidth: number;
  viewportHeight: number;
  canvasGrid: GridShape;
  previewSites: Site[];
  iconSize: number;
  horizontalGap: number;
  verticalGap: number;
  canvasWidth: number;
  canvasHeight: number;
  innerBorderRadius: number;
  faviconSize: number;
  anchorStyle: CSSProperties;
  gridAlignContent: string;
  gridJustifyContent: string;
};

export function DesktopGridItemFolderBody({
  item,
  isMergeTarget,
  showLabels,
  chrome,
  onRename,
  onOpenFolder,
}: {
  item: FolderItem;
  isMergeTarget: boolean;
  showLabels: boolean;
  chrome: FolderTileChrome;
  onRename: (newName: string) => void;
  onOpenFolder: () => void;
}) {
  const {
    viewportWidth,
    viewportHeight,
    canvasGrid,
    previewSites,
    iconSize,
    horizontalGap,
    verticalGap,
    canvasWidth,
    canvasHeight,
    innerBorderRadius,
    faviconSize,
    anchorStyle,
    gridAlignContent,
    gridJustifyContent,
  } = chrome;

  return (
    <GridDesktopCardSurface
      variant="panel"
      isMergeTarget={isMergeTarget}
      className="group/folder relative flex h-full w-full cursor-pointer flex-col overflow-hidden"
      onClick={(e) => {
        e.stopPropagation();
        onOpenFolder();
      }}
    >
      <div
        className="relative h-full w-full overflow-hidden"
        style={{ width: viewportWidth, height: viewportHeight, borderRadius: "var(--grid-panel-radius)" }}
      >
        <div
          style={{
            position: "absolute",
            ...anchorStyle,
            width: canvasWidth,
            height: canvasHeight,
            display: "grid",
            gridTemplateColumns: `repeat(${canvasGrid.cols}, ${iconSize}px)`,
            gridAutoRows: `${iconSize}px`,
            columnGap: horizontalGap,
            rowGap: verticalGap,
            alignContent: gridAlignContent,
            justifyContent: gridJustifyContent,
          }}
        >
          {previewSites.map((site, i) => (
            <DesktopGridFolderPreviewItem
              key={site.url + i}
              site={site}
              folderId={item.id}
              maxIconSize={iconSize}
              innerBorderRadius={innerBorderRadius}
              faviconSize={faviconSize}
            />
          ))}
        </div>
      </div>
      <GridItemLabel
        placement="bottom"
        editable
        initialName={item.name}
        onRename={onRename}
        showLabels={showLabels}
      />
    </GridDesktopCardSurface>
  );
}
