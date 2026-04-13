import type { AddIconCatalogEntry } from "./addIconCatalog";
import { AddIconPickerTile } from "./AddIconPickerTile";

type AddIconPickerGridProps = {
  entries: AddIconCatalogEntry[];
  selectedId: string | null;
  onSelectId: (id: string) => void;
  /** 站点：每行最多 5 列，多出的换行；组件：略宽格。 */
  gridVariant: "site" | "component";
};

const SITE_GRID = "grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5";
const COMPONENT_GRID = "grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5";

/**
 * 分区内的图标列表（listbox）。
 */
export function AddIconPickerGrid({ entries, selectedId, onSelectId, gridVariant }: AddIconPickerGridProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200/90 bg-white/40 px-4 py-8 text-center text-xs text-gray-500">
        无匹配项，试试其它关键字或筛选。
      </div>
    );
  }

  const gridClass = gridVariant === "site" ? SITE_GRID : COMPONENT_GRID;

  return (
    <div
      className={gridClass}
      role="listbox"
      aria-label="可选图标"
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
