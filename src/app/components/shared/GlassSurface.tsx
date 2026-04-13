import { forwardRef, type ComponentPropsWithoutRef } from "react";

const ROUNDED = {
  none: "",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
  full: "rounded-full",
} as const;

export type GlassSurfaceRounded = keyof typeof ROUNDED;

export type GlassSurfaceVariant =
  | "default"
  | "panel"
  | "bar"
  | "tile"
  | "sidebar"
  | "card"
  /** 多桌面底部圆点指示条（深色条 + blur） */
  | "strip"
  /** RemoteContentPlaceholder 外壳 */
  | "placeholder"
  /** App 多桌面 Suspense 占位大面板 */
  | "fallbackPanel"
  /** App 搜索栏 Suspense 占位条 */
  | "fallbackBar"
  /** 天气等 widget 懒加载骨架 */
  | "widgetSkeleton"
  /** 文件夹内站点预览格 */
  | "folderPreviewTile"
  /** 全页渐变装饰层上的极轻 backdrop-blur */
  | "pageVeil"
  /** 桌面网格：单站点小格（与 gridPanel 成对） */
  | "gridTile"
  /** 桌面网格：文件夹大卡、天气等大组件 */
  | "gridPanel";

const VARIANT_CLASS: Record<GlassSurfaceVariant, string> = {
  default: "glass-surface-default",
  panel: "glass-surface-panel",
  bar: "glass-surface-bar",
  tile: "glass-surface-tile",
  sidebar: "glass-surface-sidebar",
  card: "glass-surface-card",
  strip: "glass-surface-strip",
  placeholder: "glass-surface-placeholder",
  fallbackPanel: "glass-app-fallback-panel",
  fallbackBar: "glass-app-fallback-bar",
  widgetSkeleton: "glass-widget-skeleton",
  folderPreviewTile: "glass-folder-preview-tile",
  pageVeil: "glass-page-veil",
  gridTile: "glass-surface-grid-tile",
  gridPanel: "glass-surface-grid-panel",
};

export type GlassSurfaceProps = ComponentPropsWithoutRef<"div"> & {
  /**
   * 视觉档位，对应 `theme.css` 中 `.glass-surface-*` / `.glass-*` 与 `--glass-*` token。
   * @default "default"
   */
  variant?: GlassSurfaceVariant;
  /**
   * 圆角；站点图标等任意半径可用 `rounded="none"` 并在 `className` 里写 `rounded-[28px]`。
   * @default "xl"
   */
  rounded?: GlassSurfaceRounded;
};

/**
 * 浅色毛玻璃容器：样式来自 `src/styles/theme.css` 中 token + `.glass-surface-*` / `.glass-*`，避免业务处复制长串 Tailwind。
 */
export const GlassSurface = forwardRef<HTMLDivElement, GlassSurfaceProps>(function GlassSurface(
  { className = "", variant = "default", rounded = "xl", ...props },
  ref,
) {
  const v = VARIANT_CLASS[variant];
  const r = ROUNDED[rounded];
  return <div ref={ref} className={`${v} ${r} ${className}`.trim()} {...props} />;
});
