import { forwardRef, type ComponentPropsWithoutRef } from "react";

const ROUNDED = {
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
} as const;

export type GlassSurfaceRounded = keyof typeof ROUNDED;

export type GlassSurfaceProps = ComponentPropsWithoutRef<"div"> & {
  /**
   * 圆角规格；菜单、气泡多用 `xl`/`2xl`，大面板可用 `3xl`（与文件夹弹层一致）。
   * @default "xl"
   */
  rounded?: GlassSurfaceRounded;
};

/**
 * 项目内统一的**浅色毛玻璃**容器：半透明白底 + `backdrop-blur` + 细白边 + 柔和阴影。
 * 与 {@link SearchBar} 引擎下拉里、{@link WeatherCard}、侧栏等视觉语言对齐；需要浮层时直接包一层并补 `className` 即可。
 */
export const GlassSurface = forwardRef<HTMLDivElement, GlassSurfaceProps>(function GlassSurface(
  { className = "", rounded = "xl", ...props },
  ref,
) {
  const base =
    "border border-white/55 bg-white/50 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.14)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/45";
  return <div ref={ref} className={`${base} ${ROUNDED[rounded]} ${className}`.trim()} {...props} />;
});
