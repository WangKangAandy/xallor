import type { AddIconCatalogEntry } from "./addIconCatalog";
import { AddIconPickerTile } from "./AddIconPickerTile";

type AddIconPickerGridProps = {
  entries: AddIconCatalogEntry[];
  selectedId: string | null;
  onSelectId: (id: string) => void;
};

/**
 * 左栏可滚动图标网格（响应式列数）。
 */
export function AddIconPickerGrid({ entries, selectedId, onSelectId }: AddIconPickerGridProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/25 bg-white/5 px-4 py-8 text-center text-xs text-white/50">
        无匹配项，试试其它关键字或筛选。
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-3 gap-2 sm:grid-cols-4"
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
