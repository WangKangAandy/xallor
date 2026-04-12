import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { GlassSurface } from "../shared/GlassSurface";
import { Z_ADD_ICON_DIALOG } from "../desktopGridLayers";

export type AddIconDialogTab = "components" | "navigation" | "custom";

export type AddIconDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 触发添加入口的站点项 id；后续用于「插入到该图标旁」等逻辑。 */
  contextSiteId: string | null;
};

const TABS: { id: AddIconDialogTab; label: string }[] = [
  { id: "components", label: "组件库" },
  { id: "navigation", label: "网址导航" },
  { id: "custom", label: "自定义图标" },
];

/**
 * 「添加图标」模块外壳：顶栏 Tab、搜索、分类与内容区占位。
 * 业务数据与具体网格请后续在子组件中扩展，保持本文件只做布局与开关。
 */
export function AddIconDialog({ open, onOpenChange, contextSiteId }: AddIconDialogProps) {
  const titleId = useId();
  const [activeTab, setActiveTab] = useState<AddIconDialogTab>("navigation");

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
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-8"
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
        className="relative z-[1] flex max-h-[min(720px,90vh)] w-full max-w-3xl flex-col overflow-hidden shadow-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/30 px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={[
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  activeTab === t.id
                    ? "bg-white/90 text-gray-900 shadow-sm"
                    : "bg-white/15 text-white/90 hover:bg-white/25",
                ].join(" ")}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="关闭对话框"
            className="rounded-full p-2 text-white/90 hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p id={titleId} className="sr-only">
            添加图标 — {TABS.find((x) => x.id === activeTab)?.label}
          </p>

          <div className="mb-4">
            <div className="flex items-center gap-2 rounded-xl border border-white/35 bg-white/15 px-3 py-2 backdrop-blur-sm">
              <span className="text-white/50" aria-hidden>
                ⌕
              </span>
              <input
                type="search"
                placeholder="请输入搜索名称"
                className="min-w-0 flex-1 bg-transparent text-sm text-white/95 placeholder:text-white/45 outline-none"
                readOnly
                tabIndex={-1}
              />
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {["热门", "AI", "应用", "新闻", "影音", "科技", "设计"].map((tag, i) => (
              <button
                key={tag}
                type="button"
                className={[
                  "rounded-full px-2.5 py-1 text-xs",
                  i === 0 ? "bg-blue-500/90 text-white" : "bg-white/15 text-white/85 hover:bg-white/25",
                ].join(" ")}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-dashed border-white/35 bg-white/10 p-8 text-center text-sm text-white/75">
            <p className="font-medium text-white/90">内容区占位</p>
            <p className="mt-2">
              此处将接入网址卡片网格（参考设计稿）。当前 Tab：
              <span className="text-white"> {activeTab}</span>
            </p>
            {contextSiteId ? (
              <p className="mt-2 text-xs text-white/55">上下文站点 id（预留）：{contextSiteId}</p>
            ) : (
              <p className="mt-2 text-xs text-white/55">入口：网格末尾「添加」空位</p>
            )}
          </div>
        </div>
      </GlassSurface>
    </div>,
    document.body,
  );
}
