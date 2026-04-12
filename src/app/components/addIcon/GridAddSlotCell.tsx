import type { MouseEvent } from "react";
import { Plus } from "lucide-react";
import { GRID_CELL_SIZE } from "../desktopGridConstants";
import { Z_GRID_ITEM_BASE } from "../desktopGridLayers";
import { GlassSurface } from "../shared/GlassSurface";

type GridAddSlotCellProps = {
  onOpenAdd: () => void;
};

/**
 * 网格末尾「空位」：悬停整块区域时在占位图标区域右下角渐显毛玻璃「+」，点击打开添加模块。
 * 与站点卡片区分开，不占用 `DesktopGridItem` / DnD 链路。
 */
export function GridAddSlotCell({ onOpenAdd }: GridAddSlotCellProps) {
  const handlePlus = (e: MouseEvent<HTMLButtonElement>) => {
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
        <div className="relative h-[88px] w-[88px] shrink-0">
          <GlassSurface
            variant="tile"
            rounded="none"
            className="flex h-full w-full items-center justify-center !rounded-[28px] border border-white/25 bg-white/5 opacity-60 transition-opacity duration-300 group-hover/add-slot:opacity-100 group-hover/add-slot:bg-white/15"
          >
            <span className="sr-only">新图标空位</span>
          </GlassSurface>
          <button
            type="button"
            aria-label="添加图标"
            className={[
              "glass-grid-add-affordance absolute right-0 bottom-0 z-[15] flex h-7 w-7 items-center justify-center rounded-lg text-white/95",
              "opacity-0 translate-y-0.5 pointer-events-none transition-[opacity,transform] duration-300 ease-out",
              "group-hover/add-slot:opacity-100 group-hover/add-slot:translate-y-0 group-hover/add-slot:pointer-events-auto",
              "hover:brightness-110 active:scale-95",
              "shadow-sm",
            ].join(" ")}
            onClick={handlePlus}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          </button>
        </div>
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
