import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { GlassSurface } from "../shared/GlassSurface";
import { Z_ADD_ICON_DIALOG } from "../desktopGridLayers";

/** 左栏数据源筛选（壳子阶段仅占位，后续接真实列表）。 */
export type AddIconPickerFilter = "all" | "sites" | "components";

export type AddIconDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 触发添加入口的站点项 id；后续用于「插入到该图标旁」等逻辑。 */
  contextSiteId: string | null;
};

const PICKER_FILTERS: { id: AddIconPickerFilter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "sites", label: "站点" },
  { id: "components", label: "组件" },
];

/**
 * 「添加图标」模块：左右分栏壳子 — 左选右配、底栏双按钮；具体列表与预览在子模块中扩展。
 */
export function AddIconDialog({ open, onOpenChange, contextSiteId }: AddIconDialogProps) {
  const titleId = useId();
  const [pickerFilter, setPickerFilter] = useState<AddIconPickerFilter>("all");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-6"
      style={{ zIndex: Z_ADD_ICON_DIALOG }}
      role="presentation"
    >
      <button
        type="button"
        aria-label="关闭"
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px] transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      <GlassSurface
        variant="panel"
        rounded="3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] flex max-h-[min(680px,92vh)] w-full max-w-5xl flex-col overflow-hidden shadow-2xl"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/30 px-5 py-3.5">
          <h2 id={titleId} className="text-base font-semibold text-white/95">
            添加图标
          </h2>
          <button
            type="button"
            aria-label="关闭对话框"
            className="rounded-full p-2 text-white/90 hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          {/* 左栏：搜索 + 筛选 + 列表占位 */}
          <aside className="flex min-h-[200px] w-full shrink-0 flex-col border-white/25 sm:min-h-0 sm:w-[min(100%,320px)] sm:border-r">
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
                {PICKER_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={pickerFilter === f.id}
                    onClick={() => setPickerFilter(f.id)}
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

          {/* 右栏：预览与配置占位 */}
          <section className="flex min-h-[220px] min-w-0 flex-1 flex-col p-4 sm:min-h-0 sm:p-5">
            <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-dashed border-white/30 bg-white/8 p-6">
              <p className="text-sm font-medium text-white/90">右侧预览与配置</p>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                选中左侧项后，此处展示头部信息（名称 / 类型标签）、预览区与专属配置（站点 URL、组件尺寸等）。
              </p>
              <div className="mt-4 flex flex-1 items-center justify-center rounded-lg border border-white/15 bg-white/5 p-4 text-center text-xs text-white/45">
                未选择左侧项时的空态占位
              </div>
              {contextSiteId ? (
                <p className="mt-3 text-[11px] text-white/45">上下文站点 id（预留）：{contextSiteId}</p>
              ) : (
                <p className="mt-3 text-[11px] text-white/45">入口：网格末尾「添加」空位</p>
              )}
            </div>
          </section>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-white/25 px-4 py-3 sm:px-5">
          <button
            type="button"
            className="rounded-xl border border-white/35 bg-white/12 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            保存并退出
          </button>
          <button
            type="button"
            className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-600"
            onClick={() => onOpenChange(false)}
          >
            保存并继续添加
          </button>
        </footer>
      </GlassSurface>
    </div>,
    document.body,
  );
}
