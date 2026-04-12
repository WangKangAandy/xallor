import { Check } from "lucide-react";
import { FaviconIcon } from "../shared/FaviconIcon";
import { GlassSurface } from "../shared/GlassSurface";
import type { AddIconCatalogEntry } from "./addIconCatalog";

type AddIconPickerTileProps = {
  entry: AddIconCatalogEntry;
  selected: boolean;
  onSelect: () => void;
};

/**
 * 左栏单格：站点显示 favicon；组件显示简图标。选中时蓝框 + 右上勾选（对齐图二）。
 */
export function AddIconPickerTile({ entry, selected, onSelect }: AddIconPickerTileProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={[
        "group/tile relative flex w-full flex-col items-center gap-1.5 rounded-xl p-1.5 text-left outline-none transition-[box-shadow,transform]",
        "focus-visible:ring-2 focus-visible:ring-white/60",
        selected ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent" : "ring-1 ring-white/20 hover:ring-white/35",
      ].join(" ")}
    >
      {selected ? (
        <span className="absolute right-0.5 top-0.5 z-[1] flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
          <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
        </span>
      ) : null}

      {entry.kind === "site" ? (
        <GlassSurface
          variant="tile"
          rounded="none"
          className="flex h-14 w-14 items-center justify-center !rounded-2xl"
        >
          <FaviconIcon domain={entry.domain} name={entry.name} size={36} />
        </GlassSurface>
      ) : (
        <GlassSurface
          variant="tile"
          rounded="none"
          className="flex h-14 w-14 items-center justify-center !rounded-2xl text-2xl"
          aria-hidden
        >
          {entry.widgetType === "weather" ? "⛅" : "📅"}
        </GlassSurface>
      )}

      <span className="line-clamp-2 w-full text-center text-[10px] font-medium leading-tight text-white/90">
        {entry.name}
      </span>
    </button>
  );
}
