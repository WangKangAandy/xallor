import type { AddIconCatalogEntry } from "./addIconCatalog";
import { AddIconPickerGrid } from "./AddIconPickerGrid";

type AddIconPickerSectionProps = {
  title: string;
  viewMoreLabel: string;
  gridVariant: "site" | "component";
  entries: AddIconCatalogEntry[];
  selectedId: string | null;
  onSelectId: (id: string) => void;
};

/**
 * 左栏分区标题（站点 / 组件）+ 「查看更多」占位，与图二分区结构一致。
 */
export function AddIconPickerSection({
  title,
  viewMoreLabel,
  gridVariant,
  entries,
  selectedId,
  onSelectId,
}: AddIconPickerSectionProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="mb-5 last:mb-0" aria-label={title}>
      <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
        <h3 className="text-sm font-semibold tracking-tight text-gray-800">{title}</h3>
        <button
          type="button"
          className="shrink-0 text-xs font-medium text-gray-500 hover:text-gray-700 hover:underline"
        >
          {viewMoreLabel}
        </button>
      </div>
      <AddIconPickerGrid
        gridVariant={gridVariant}
        entries={entries}
        selectedId={selectedId}
        onSelectId={onSelectId}
      />
    </section>
  );
}
