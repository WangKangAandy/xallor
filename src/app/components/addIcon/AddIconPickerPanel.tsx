import { Search, X } from "lucide-react";
import { ADD_ICON_PICKER_FILTERS, type AddIconPickerFilter } from "./addIconPickerConstants";
import type { AddIconCatalogEntry } from "./addIconCatalog";
import { AddIconPickerSection } from "./AddIconPickerSection";
import { useAppI18n } from "../../i18n/AppI18n";

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
  const { t } = useAppI18n();
  const siteEntries = filteredEntries.filter((e) => e.kind === "site");
  const componentEntries = filteredEntries.filter((e) => e.kind === "component");

  const showSites = pickerFilter === "all" || pickerFilter === "sites";
  const showComponents = pickerFilter === "all" || pickerFilter === "components";

  const hasAnySection =
    (showSites && siteEntries.length > 0) || (showComponents && componentEntries.length > 0);

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-1 flex-col border-border/70 sm:border-r sm:border-border">
      <div className="flex flex-col gap-3 px-4 pb-2 pt-4 sm:px-5 sm:pt-5">
        <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--add-icon-surface-border)] bg-[color:var(--add-icon-surface-raised)] px-3 py-2.5 shadow-sm">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            type="text"
            placeholder={t("addIcon.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            autoComplete="off"
          />
          {searchQuery ? (
            <button
              type="button"
              aria-label={t("addIcon.clearSearch")}
              className="shrink-0 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={() => onSearchQueryChange("")}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t("addIcon.filterTabLabel")}>
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
                  ? "bg-secondary text-secondary-foreground shadow-sm"
                  : "bg-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              ].join(" ")}
            >
              {f.id === "all"
                ? t("addIcon.filterAll")
                : f.id === "sites"
                  ? t("addIcon.filterSites")
                  : t("addIcon.filterComponents")}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 sm:px-5">
        {!hasAnySection ? (
          <div className="rounded-xl border border-dashed border-[color:var(--add-icon-surface-border)] bg-[color:var(--add-icon-surface-subtle)] px-4 py-10 text-center text-xs text-muted-foreground">
            {t("addIcon.noResults")}
          </div>
        ) : (
          <>
            {showSites ? (
              <AddIconPickerSection
                title={t("addIcon.sectionSites")}
                viewMoreLabel={t("addIcon.viewMore")}
                gridVariant="site"
                entries={siteEntries}
                selectedId={selectedId}
                onSelectId={onSelectId}
              />
            ) : null}
            {showComponents ? (
              <AddIconPickerSection
                title={t("addIcon.sectionComponents")}
                viewMoreLabel={t("addIcon.viewMore")}
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
