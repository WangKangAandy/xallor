import { Search, X } from "lucide-react";
import { ADD_ICON_PICKER_FILTERS, type AddIconPickerFilter } from "./addIconPickerConstants";
import type { AddIconCatalogEntry } from "./addIconCatalog";
import { AddIconPickerSection } from "./AddIconPickerSection";

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
 * 左栏：搜索（仿图二）、筛选 Tab、站点 / 组件分区展示。
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
  const siteEntries = filteredEntries.filter((e) => e.kind === "site");
  const componentEntries = filteredEntries.filter((e) => e.kind === "component");

  const showSites = pickerFilter === "all" || pickerFilter === "sites";
  const showComponents = pickerFilter === "all" || pickerFilter === "components";

  const hasAnySection =
    (showSites && siteEntries.length > 0) || (showComponents && componentEntries.length > 0);

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-1 flex-col border-gray-200/50 sm:border-r">
      <div className="flex flex-col gap-3 px-4 pb-2 pt-4 sm:px-5 sm:pt-5">
        <div className="flex items-center gap-2 rounded-2xl border border-gray-100/90 bg-white/85 px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
          <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          <input
            type="text"
            placeholder="搜索站点或输入网址（如：github.com）"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
            autoComplete="off"
          />
          {searchQuery ? (
            <button
              type="button"
              aria-label="清除搜索"
              className="shrink-0 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              onClick={() => onSearchQueryChange("")}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
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
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                pickerFilter === f.id
                  ? "bg-white text-blue-600 shadow-sm"
                  : "bg-transparent text-gray-600 hover:bg-white/50",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 sm:px-5">
        {!hasAnySection ? (
          <div className="rounded-xl border border-dashed border-gray-300/80 bg-white/50 px-4 py-10 text-center text-xs text-gray-500">
            无匹配项，试试其它关键字或筛选。
          </div>
        ) : (
          <>
            {showSites ? (
              <AddIconPickerSection
                title="站点"
                gridVariant="site"
                entries={siteEntries}
                selectedId={selectedId}
                onSelectId={onSelectId}
              />
            ) : null}
            {showComponents ? (
              <AddIconPickerSection
                title="组件"
                gridVariant="component"
                entries={componentEntries}
                selectedId={selectedId}
                onSelectId={onSelectId}
              />
            ) : null}
          </>
        )}
      </div>
    </aside>
  );
}
