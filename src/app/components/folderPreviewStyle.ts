export function buildFolderPreviewItemStyle(params: {
  maxIconSize: number;
  innerBorderRadius: number;
  isDragging: boolean;
}): React.CSSProperties {
  const { maxIconSize, innerBorderRadius, isDragging } = params;
  return {
    // Keep preview tiles always square to avoid transient stretch during parent resize animation.
    width: `min(100%, ${maxIconSize}px)`,
    aspectRatio: "1 / 1",
    borderRadius: innerBorderRadius,
    background: "rgba(255,255,255,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    transition: "background 0.2s",
    opacity: isDragging ? 0 : 1,
  };
}

