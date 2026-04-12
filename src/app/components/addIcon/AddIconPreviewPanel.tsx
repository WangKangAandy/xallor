type AddIconPreviewPanelProps = {
  contextSiteId: string | null;
};

/**
 * 右栏：仅预览与简要说明（窄列，不作为主工作区）。
 */
export function AddIconPreviewPanel({ contextSiteId }: AddIconPreviewPanelProps) {
  return (
    <section className="flex min-h-[180px] w-full shrink-0 flex-col sm:min-h-0 sm:max-w-[320px] sm:min-w-[260px] lg:min-w-[280px] lg:max-w-[340px]">
      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
        <div className="flex min-h-[min(280px,40vh)] min-w-0 flex-1 flex-col rounded-xl border border-dashed border-white/30 bg-white/8 p-4 sm:min-h-0 sm:p-5">
          <p className="text-xs font-medium text-white/85">预览</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-white/55">
            选中左侧项后展示缩略效果；完整配置仍以左栏为主。
          </p>
          <div className="mt-3 flex flex-1 items-center justify-center rounded-lg border border-white/15 bg-white/5 p-3 text-center text-[11px] text-white/40">
            空态
          </div>
          {contextSiteId ? (
            <p className="mt-2 text-[10px] leading-snug text-white/40">上下文站点 id（预留）：{contextSiteId}</p>
          ) : (
            <p className="mt-2 text-[10px] leading-snug text-white/40">入口：网格末尾「添加」空位</p>
          )}
        </div>
      </div>
    </section>
  );
}
