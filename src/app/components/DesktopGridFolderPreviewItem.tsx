import { useDrag } from "react-dnd";
import type { Site } from "./desktopGridTypes";
import { Favicon } from "./DesktopGridItemPrimitives";
import { buildFolderPreviewItemStyle } from "./folderPreviewStyle";

export function DesktopGridFolderPreviewItem({
  site,
  folderId,
  maxIconSize,
  innerBorderRadius,
  faviconSize,
}: {
  site: Site;
  folderId: string;
  maxIconSize: number;
  innerBorderRadius: number;
  faviconSize: number;
}) {
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: "ITEM",
    item: () => ({ id: `folder-item-${folderId}-${site.url}`, type: "folder-site", sourceFolderId: folderId, site }),
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  });

  return (
    <div
      ref={drag}
      onClick={(e) => {
        e.stopPropagation();
        window.open(site.url, "_blank");
      }}
      style={buildFolderPreviewItemStyle({ maxIconSize, innerBorderRadius, isDragging })}
      className="hover:bg-white/80 cursor-grab active:cursor-grabbing"
    >
      <div ref={dragPreview}>
        <Favicon domain={site.domain} name={site.name} size={faviconSize} />
      </div>
    </div>
  );
}
