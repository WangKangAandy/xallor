import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { GlassSurface } from "./shared/GlassSurface";

export type GridDesktopCardSurfaceVariant = "tile" | "panel";

/** 取值见 theme.css `--grid-merge-*`（浅色 :root / 深色 .dark） */
const MERGE_TARGET_STYLE: React.CSSProperties = {
  border: "var(--grid-merge-border-width, 3px) solid var(--grid-merge-border-color, #3b82f6)",
  boxShadow: "var(--grid-merge-shadow)",
};

export type GridDesktopCardSurfaceProps = Omit<ComponentPropsWithoutRef<typeof GlassSurface>, "variant" | "rounded"> & {
  variant: GridDesktopCardSurfaceVariant;
  /** 合并目标高亮（与 useGridDnD merge 一致） */
  isMergeTarget?: boolean;
};

/**
 * 桌面网格统一「卡片面」：tile = 单站点小格；panel = 文件夹大卡 / 天气等。
 * 毛玻璃与圆角来自 theme.css `--grid-*` + `.glass-surface-grid-*`。
 */
export const GridDesktopCardSurface = forwardRef<HTMLDivElement, GridDesktopCardSurfaceProps>(
  function GridDesktopCardSurface({ variant, isMergeTarget, className = "", style, ...rest }, ref) {
    const glassVariant = variant === "tile" ? "gridTile" : "gridPanel";
    return (
      <GlassSurface
        ref={ref}
        variant={glassVariant}
        rounded="none"
        className={className}
        style={{
          ...(isMergeTarget ? MERGE_TARGET_STYLE : undefined),
          ...style,
        }}
        {...rest}
      />
    );
  },
);
