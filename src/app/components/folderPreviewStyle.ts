import type { CSSProperties } from "react";

export function buildFolderPreviewItemStyle(params: {
  maxIconSize: number;
  innerBorderRadius: number;
  isDragging: boolean;
}): CSSProperties {
  const { maxIconSize, innerBorderRadius, isDragging } = params;
  return {
    // Keep preview tiles always square to avoid transient stretch during parent resize animation.
    width: `min(100%, ${maxIconSize}px)`,
    aspectRatio: "1 / 1",
    borderRadius: innerBorderRadius,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: isDragging ? 0 : 1,
  };
}
