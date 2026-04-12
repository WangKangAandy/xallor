import { FaviconIcon } from "../shared/FaviconIcon";
import { GlassSurface } from "../shared/GlassSurface";
import type { AddIconCatalogEntry } from "./addIconCatalog";

type AddIconPreviewPanelProps = {
  selected: AddIconCatalogEntry | null;
  contextSiteId: string | null;
};

/**
 * 右栏：窄预览带；选中项时展示标题 / 类型标签 / 缩略区（完整表单后续在左栏或本栏扩展）。
 */
export function AddIconPreviewPanel({ selected, contextSiteId }: AddIconPreviewPanelProps) {
  return (
    <section className="flex min-h-[180px] w-full shrink-0 flex-col sm:min-h-0 sm:max-w-[320px] sm:min-w-[260px] lg:min-w-[280px] lg:max-w-[340px]">
      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
        <div className="flex min-h-[min(280px,40vh)] min-w-0 flex-1 flex-col rounded-xl border border-dashed border-white/30 bg-white/8 p-4 sm:min-h-0 sm:p-5">
          <p className="text-xs font-medium text-white/85">预览</p>

          {!selected ? (
            <>
              <p className="mt-1.5 text-[11px] leading-relaxed text-white/55">
                在左侧选择一个站点或组件，此处显示摘要。
              </p>
              <div className="mt-3 flex flex-1 items-center justify-center rounded-lg border border-white/15 bg-white/5 p-3 text-center text-[11px] text-white/40">
                未选择
              </div>
            </>
          ) : selected.kind === "site" ? (
            <div className="mt-3 flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex items-start gap-2">
                <GlassSurface variant="tile" rounded="none" className="flex h-12 w-12 shrink-0 items-center justify-center !rounded-xl">
                  <FaviconIcon domain={selected.domain} name={selected.name} size={28} />
                </GlassSurface>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white/95">{selected.name}</p>
                  <p className="truncate text-[11px] text-white/55">{selected.domain}</p>
                  <span className="mt-1 inline-block rounded-md bg-blue-500/85 px-2 py-0.5 text-[10px] font-medium text-white">
                    站点
                  </span>
                </div>
              </div>
              <div className="flex flex-1 items-center justify-center rounded-lg border border-white/15 bg-white/5 p-3 text-[10px] text-white/45">
                站点图标样式等配置（占位）
              </div>
            </div>
          ) : (
            <div className="mt-3 flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex items-start gap-2">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-2xl"
                  aria-hidden
                >
                  {selected.widgetType === "weather" ? "⛅" : "📅"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white/95">{selected.name}</p>
                  <p className="truncate text-[11px] text-white/55">{selected.subtitle}</p>
                  <span className="mt-1 inline-block rounded-md bg-emerald-600/90 px-2 py-0.5 text-[10px] font-medium text-white">
                    组件
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-white/45">组件尺寸</p>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] text-white/55">
                  <div className="rounded-lg border border-white/20 bg-white/8 py-2">大 4×2</div>
                  <div className="rounded-lg border border-white/20 bg-white/8 py-2">中 2×2</div>
                  <div className="rounded-lg border border-white/20 bg-white/8 py-2">小 2×1</div>
                </div>
              </div>
              <div className="flex flex-1 items-center justify-center rounded-lg border border-white/15 bg-white/5 p-2 text-[10px] text-white/45">
                实时预览（占位）
              </div>
            </div>
          )}

          {contextSiteId ? (
            <p className="mt-3 border-t border-white/15 pt-2 text-[10px] leading-snug text-white/40">
              上下文站点 id（预留）：{contextSiteId}
            </p>
          ) : (
            <p className="mt-3 border-t border-white/15 pt-2 text-[10px] leading-snug text-white/40">
              入口：网格末尾「添加」空位
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
