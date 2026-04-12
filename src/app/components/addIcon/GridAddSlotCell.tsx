import type { MouseEvent } from "react";
import { Plus } from "lucide-react";
import { GRID_CELL_SIZE } from "../desktopGridConstants";
import { Z_GRID_ITEM_BASE } from "../desktopGridLayers";
import { GlassSurface } from "../shared/GlassSurface";

type GridAddSlotCellProps = {
  onOpenAdd: () => void;
};

/**
 * 网格末尾「空位」：默认完全不可见；悬停整块格时渐显毛玻璃占位，**中央「+」** 与下方「添加」文案。
 * 与站点卡片区分开，不占用 `DesktopGridItem` / DnD 链路。
 */
export function GridAddSlotCell({ onOpenAdd }: GridAddSlotCellProps) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onOpenAdd();
  };

  return (
    <div
      style={{
        gridColumn: "span 1",
        gridRow: "span 1",
        width: GRID_CELL_SIZE,
        height: GRID_CELL_SIZE,
        zIndex: Z_GRID_ITEM_BASE,
      }}
      className="relative flex items-center justify-center pointer-events-auto group/add-slot"
    >
      <div className="relative flex flex-col items-center">
        <GlassSurface
          variant="tile"
          rounded="none"
          className="!rounded-[28px] border border-white/25 bg-white/5 p-0 opacity-0 transition-opacity duration-300 ease-out group-hover/add-slot:opacity-100 group-hover/add-slot:bg-white/15"
        >
          <button
            type="button"
            aria-label="添加图标"
            className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-[28px] text-white/95 outline-none transition-transform hover:brightness-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            onClick={handleClick}
          >
            <Plus className="h-9 w-9" strokeWidth={2} aria-hidden />
          </button>
        </GlassSurface>
        <span
          className="pointer-events-none absolute -bottom-7 left-1/2 max-w-[100px] -translate-x-1/2 whitespace-nowrap text-[13px] font-medium text-white/95 opacity-0 shadow-sm transition-opacity duration-300 group-hover/add-slot:opacity-100"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
        >
          添加
        </span>
      </div>
    </div>
  );
}
