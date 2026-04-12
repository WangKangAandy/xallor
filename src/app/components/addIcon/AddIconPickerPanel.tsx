import { ADD_ICON_PICKER_FILTERS, type AddIconPickerFilter } from "./addIconPickerConstants";

type AddIconPickerPanelProps = {
  pickerFilter: AddIconPickerFilter;
  onPickerFilterChange: (f: AddIconPickerFilter) => void;
};

/**
 * 左栏：搜索、类型筛选、可滚动列表区（主区域，占宽大于右侧）。
 */
export function AddIconPickerPanel({ pickerFilter, onPickerFilterChange }: AddIconPickerPanelProps) {
  return (
    <aside className="flex min-h-[220px] min-w-0 flex-1 flex-col border-white/25 sm:min-h-0 sm:border-r">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2 rounded-xl border border-white/35 bg-white/15 px-3 py-2 backdrop-blur-sm">
          <span className="text-white/50" aria-hidden>
            ⌕
          </span>
          <input
            type="search"
            placeholder="搜索"
            className="min-w-0 flex-1 bg-transparent text-sm text-white/95 placeholder:text-white/45 outline-none"
            readOnly
            tabIndex={-1}
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
        <div className="rounded-xl border border-dashed border-white/35 bg-white/8 p-6 text-center text-xs leading-relaxed text-white/65">
          <p className="font-medium text-white/85">左侧列表占位</p>
          <p className="mt-2">
            当前筛选：<span className="text-white/90">{pickerFilter}</span>
          </p>
          <p className="mt-2 text-[11px] text-white/50">此处将接入站点 / 组件图标网格（含选中态）。</p>
        </div>
      </div>
    </aside>
  );
}
