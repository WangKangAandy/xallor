import { Check } from "lucide-react";
import { useAppI18n } from "../../i18n/AppI18n";
import { FaviconIcon } from "../shared/FaviconIcon";
import type { AddIconCatalogEntry } from "./addIconCatalog";

type AddIconPickerTileProps = {
  entry: AddIconCatalogEntry;
  selected: boolean;
  onSelect: () => void;
};

const tileBase =
  "group/tile relative text-left outline-none transition-[box-shadow,background-color,border-color] duration-150 " +
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background";

/** 未选中：使用 `theme.css` 中 `--add-icon-surface-*`，避免深色下 `bg-card` 与背景同色成死黑块。 */
const idleSurface =
  "border border-[color:var(--add-icon-surface-border)] bg-[color:var(--add-icon-surface-raised)] shadow-sm " +
  "hover:border-[color:var(--add-icon-surface-border)] hover:bg-[color:var(--add-icon-surface-raised-hover)] hover:shadow-md";

const selectedSurface = "border border-primary bg-primary/12 shadow-sm ring-1 ring-ring/30";

/**
 * 站点：方形磁贴；组件：与站点同列宽（同网格），图标区与站点同一套 h-8 / sm:h-9。
 */
export function AddIconPickerTile({ entry, selected, onSelect }: AddIconPickerTileProps) {
  const { t } = useAppI18n();
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
          <span className="absolute right-0.5 top-0.5 z-[1] flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Check className="h-2 w-2" strokeWidth={3} aria-hidden />
          </span>
        ) : null}

        <div className="flex h-8 w-8 shrink-0 items-center justify-center sm:h-9 sm:w-9">
          <FaviconIcon domain={entry.domain} name={entry.name} size={22} />
        </div>
        <div className="min-w-0 px-0.5 text-center">
          <p className="line-clamp-2 text-[10px] font-semibold leading-tight text-foreground sm:text-[11px]">{entry.name}</p>
          <p className="mt-px line-clamp-1 text-[9px] text-muted-foreground sm:text-[10px]">{entry.domain}</p>
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
        "flex h-[4.5rem] w-full min-w-0 flex-row items-center gap-2 rounded-xl p-2 sm:h-[4.75rem] sm:gap-2.5 sm:p-2.5",
        selected ? selectedSurface : idleSurface,
      ].join(" ")}
    >
      {selected ? (
        <span className="absolute right-1 top-1 z-[1] flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
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
        <p className="line-clamp-2 text-[10px] font-semibold leading-tight text-foreground sm:text-[11px]">{t(entry.nameKey)}</p>
        <p className="mt-px line-clamp-2 text-[9px] leading-relaxed text-muted-foreground sm:text-[10px]">{t(entry.subtitleKey)}</p>
      </div>
    </button>
  );
}
