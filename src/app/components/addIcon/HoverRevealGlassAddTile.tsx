import type { MouseEvent } from "react";
import { Plus } from "lucide-react";
import { GlassSurface } from "../shared/GlassSurface";

/** 与 `GridAddSlotCell` 一致：默认不可见，悬停整块命中区渐显毛玻璃与「+」。 */
export type HoverRevealAddHoverGroup = "add-slot" | "dock-add";

type HoverRevealGlassAddTileProps = {
  onOpenAdd: () => void;
  /** 空桌面等场景下始终可见（网格首屏）。 */
  alwaysVisible?: boolean;
  hoverGroup: HoverRevealAddHoverGroup;
  /** 命中区与按钮尺寸（px）。 */
  sizePx: number;
  /** GlassSurface + button 共用圆角（含 Tailwind important 如 `!rounded-xl`）。 */
  tileRoundedClass: string;
  plusClassName: string;
  ariaLabel: string;
};

export function HoverRevealGlassAddTile({
  onOpenAdd,
  alwaysVisible = false,
  hoverGroup,
  sizePx,
  tileRoundedClass,
  plusClassName,
  ariaLabel,
}: HoverRevealGlassAddTileProps) {
  const groupClass = hoverGroup === "add-slot" ? "group/add-slot" : "group/dock-add";
  const hoverGlass =
    hoverGroup === "add-slot"
      ? "group-hover/add-slot:bg-white/15 group-hover/add-slot:opacity-100"
      : "group-hover/dock-add:bg-white/15 group-hover/dock-add:opacity-100";

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onOpenAdd();
  };

  return (
    <div
      style={{ width: sizePx, height: sizePx }}
      className={`relative flex items-center justify-center pointer-events-auto ${groupClass}`}
    >
      <GlassSurface
        variant="tile"
        rounded="none"
        className={`${tileRoundedClass} border border-white/25 p-0 transition-opacity duration-300 ease-out ${
          alwaysVisible ? "bg-white/12 opacity-100" : `bg-white/5 opacity-0 ${hoverGlass}`
        }`}
      >
        <button
          type="button"
          aria-label={ariaLabel}
          className={`flex shrink-0 items-center justify-center text-white/95 outline-none transition-transform hover:brightness-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${tileRoundedClass}`}
          style={{ width: sizePx, height: sizePx }}
          onClick={handleClick}
        >
          <Plus className={plusClassName} strokeWidth={2} aria-hidden />
        </button>
      </GlassSurface>
    </div>
  );
}
