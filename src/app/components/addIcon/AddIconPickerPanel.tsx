import { ADD_ICON_PICKER_FILTERS, type AddIconPickerFilter } from "./addIconPickerConstants";
import type { AddIconCatalogEntry } from "./addIconCatalog";
import { AddIconPickerGrid } from "./AddIconPickerGrid";

type AddIconPickerPanelProps = {
  pickerFilter: AddIconPickerFilter;
  onPickerFilterChange: (f: AddIconPickerFilter) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  filteredEntries: AddIconCatalogEntry[];
  selectedId: string | null;
  onSelectId: (id: string) => void;
};

/**
 * 左栏：搜索、类型筛选、图标网格（主区域）。
 */
export function AddIconPickerPanel({
  pickerFilter,
  onPickerFilterChange,
  searchQuery,
  onSearchQueryChange,
  filteredEntries,
  selectedId,
  onSelectId,
}: AddIconPickerPanelProps) {
  return (
    <aside className="flex min-h-[220px] min-w-0 flex-1 flex-col border-white/25 sm:min-h-0 sm:border-r">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2 rounded-xl border border-white/35 bg-white/15 px-3 py-2 backdrop-blur-sm">
          <span className="text-white/50" aria-hidden>
            ⌕
          </span>
          <input
            type="search"
            placeholder="搜索名称或域名"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-white/95 placeholder:text-white/45 outline-none"
            autoComplete="off"
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="列表类型">
          {ADD_ICON_PICKER_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={pickerFilter === f.id}
              onClick={() => onPickerFilterChange(f.id)}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                pickerFilter === f.id
                  ? "bg-white/90 text-gray-900 shadow-sm"
                  : "bg-white/12 text-white/88 hover:bg-white/22",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <AddIconPickerGrid entries={filteredEntries} selectedId={selectedId} onSelectId={onSelectId} />
      </div>
    </aside>
  );
}
