import type { CSSProperties } from "react";
import type { FolderItem, GridShape, Site } from "./desktopGridTypes";
import { DesktopGridFolderPreviewItem } from "./DesktopGridFolderPreviewItem";
import { EditableLabel } from "./DesktopGridItemPrimitives";

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
    <div
      className="relative flex flex-col w-full h-full pointer-events-auto cursor-pointer group/folder"
      onClick={(e) => {
        e.stopPropagation();
        onOpenFolder();
      }}
      style={{
        borderRadius: 36,
        backdropFilter: "blur(16px)",
        background: "rgba(255,255,255,0.35)",
        border: isMergeTarget ? "3px solid #3b82f6" : "1px solid rgba(255,255,255,0.65)",
        transition: "transform 0.2s",
        boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
      }}
    >
      <div className="relative w-full h-full overflow-hidden" style={{ width: viewportWidth, height: viewportHeight, borderRadius: 36 }}>
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
      <EditableLabel
        initialName={item.name}
        onRename={onRename}
        showLabels={showLabels}
        className="hover:bg-black/10 px-1 rounded transition-colors"
        style={{
          position: "absolute",
          bottom: -28,
          fontSize: 13,
          color: "rgba(255,255,255,0.95)",
          maxWidth: 100,
          left: "50%",
          transform: "translateX(-50%)",
          textShadow: "0 1px 4px rgba(0,0,0,0.4)",
          fontWeight: 500,
        }}
        inputClassName="placeholder:text-white/60 text-center"
        inputStyle={{
          position: "absolute",
          bottom: -30,
          width: "120%",
          left: "-10%",
          fontSize: 13,
          color: "rgba(255,255,255,0.95)",
          textShadow: "0 1px 4px rgba(0,0,0,0.4)",
          fontWeight: 500,
        }}
      />
    </div>
  );
}
