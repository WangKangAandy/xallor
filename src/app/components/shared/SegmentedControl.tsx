import type { ReactNode } from "react";

export type SegmentedOption<T extends string = string> = {
  value: T;
  label: ReactNode;
  testId?: string;
};

export type SegmentedControlProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  /** 传给 `role="group"` 的无障碍标签 */
  ariaLabel: string;
  className?: string;
};

/**
 * 设置面板等场景用的双段/多段切换：浅灰轨道 + 选中项白底阴影，与布局模式切换视觉一致。
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  const rootClass = [
    "inline-flex min-w-0 max-w-full shrink flex-wrap gap-0.5 rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 sm:flex-nowrap",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            data-testid={opt.testId}
            aria-pressed={active}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              active ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
