import { Check } from "lucide-react";
import { FaviconIcon } from "../shared/FaviconIcon";
import type { AddIconCatalogEntry } from "./addIconCatalog";

type AddIconPickerTileProps = {
  entry: AddIconCatalogEntry;
  selected: boolean;
  onSelect: () => void;
};

const tileBase =
  "group/tile relative text-left outline-none transition-[box-shadow,background-color,border-color] duration-150 " +
  "focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-1";

/** 图一：靠轻阴影托起，边框极弱；选中为细蓝边 + 淡蓝底。 */
const idleSurface =
  "border border-gray-100/60 bg-white/85 shadow-[0_2px_8px_rgba(15,23,42,0.06)] hover:border-gray-200/70 hover:bg-white hover:shadow-[0_3px_10px_rgba(15,23,42,0.07)]";

const selectedSurface =
  "border border-blue-500 bg-blue-50/55 shadow-[0_1px_4px_rgba(37,99,235,0.12)]";

/**
 * 站点：方形磁贴；组件：与站点同列宽（同网格），图标区与站点同一套 h-8 / sm:h-9。
 */
export function AddIconPickerTile({ entry, selected, onSelect }: AddIconPickerTileProps) {
  if (entry.kind === "site") {
    return (
      <button
        type="button"
        role="option"
        aria-selected={selected}
        onClick={onSelect}
        className={[
          tileBase,
          "flex w-full max-w-full aspect-square flex-col items-center justify-center gap-1 rounded-xl p-1.5 sm:p-2",
          selected ? selectedSurface : idleSurface,
        ].join(" ")}
      >
        {selected ? (
          <span className="absolute right-0.5 top-0.5 z-[1] flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
            <Check className="h-2 w-2" strokeWidth={3} aria-hidden />
          </span>
        ) : null}

        <div className="flex h-8 w-8 shrink-0 items-center justify-center sm:h-9 sm:w-9">
          <FaviconIcon domain={entry.domain} name={entry.name} size={22} />
        </div>
        <div className="min-w-0 px-0.5 text-center">
          <p className="line-clamp-2 text-[10px] font-semibold leading-tight text-gray-900 sm:text-[11px]">{entry.name}</p>
          <p className="mt-px line-clamp-1 text-[9px] text-gray-500 sm:text-[10px]">{entry.domain}</p>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={[
        tileBase,
        // 组件保持与站点同列宽基准，但使用更宽的横向卡片比例（接近设计稿观感）。
        "flex h-[4.5rem] w-full min-w-0 flex-row items-center gap-2 rounded-xl p-2 sm:h-[4.75rem] sm:gap-2.5 sm:p-2.5",
        selected ? selectedSurface : idleSurface,
      ].join(" ")}
    >
      {selected ? (
        <span className="absolute right-1 top-1 z-[1] flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
          <Check className="h-2 w-2" strokeWidth={3} aria-hidden />
        </span>
      ) : null}

      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center text-2xl leading-none sm:h-11 sm:w-11 sm:text-3xl"
        aria-hidden
      >
        {entry.widgetType === "weather" ? "⛅" : "📅"}
      </div>
      <div className="min-w-0 flex-1 pr-3 text-left">
        <p className="line-clamp-2 text-[10px] font-semibold leading-tight text-gray-900 sm:text-[11px]">{entry.name}</p>
        <p className="mt-px line-clamp-2 text-[9px] leading-relaxed text-gray-500 sm:text-[10px]">{entry.subtitle}</p>
      </div>
    </button>
  );
}
