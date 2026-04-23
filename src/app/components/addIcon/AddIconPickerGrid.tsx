import type { AddIconCatalogEntry } from "./addIconCatalog";
import { AddIconPickerTile } from "./AddIconPickerTile";
import { useAppI18n } from "../../i18n/AppI18n";

type AddIconPickerGridProps = {
  entries: AddIconCatalogEntry[];
  selectedId: string | null;
  onSelectId: (id: string) => void;
  /** 站点：高密度多列；组件：减少列数以获得更宽卡片。 */
  gridVariant: "site" | "component";
};

/** 列数随容器变窄自动减少，避免右栏占位时站点磁贴被压到重叠 */
const SITE_GRID = "grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(4.75rem,1fr))]";
/** 组件行卡片需要更宽轨道，避免标题与图标挤成一团 */
const COMPONENT_GRID = "grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(10.5rem,1fr))]";

/**
 * 分区内的图标列表（listbox）。
 */
export function AddIconPickerGrid({ entries, selectedId, onSelectId, gridVariant }: AddIconPickerGridProps) {
  const { t } = useAppI18n();
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[color:var(--add-icon-surface-border)] bg-[color:var(--add-icon-surface-subtle)] px-4 py-8 text-center text-xs text-muted-foreground">
        {t("addIcon.noResults")}
      </div>
    );
  }

  const gridClass = gridVariant === "site" ? SITE_GRID : COMPONENT_GRID;

  return (
    <div
      className={gridClass}
      role="listbox"
      aria-label={t("addIcon.selectableIcons")}
      aria-multiselectable={false}
    >
      {entries.map((entry) => (
        <AddIconPickerTile
          key={entry.id}
          entry={entry}
          selected={selectedId === entry.id}
          onSelect={() => onSelectId(entry.id)}
        />
      ))}
    </div>
  );
}
