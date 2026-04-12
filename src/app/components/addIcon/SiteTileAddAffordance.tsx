import type { MouseEvent } from "react";
import { Plus } from "lucide-react";

type SiteTileAddAffordanceProps = {
  /** 点击加号时调用（须 `stopPropagation`，避免触发打开链接）。 */
  onPress: (e: MouseEvent<HTMLButtonElement>) => void;
  /** 拖拽源格时不展示角标，避免与 DnD 冲突。 */
  suppress: boolean;
};

/**
 * 站点图标区域内的「添加」角标：右下角、毛玻璃、默认隐藏，悬停整块 `group/site` 时渐显。
 * 后续「网址导航」弹层由父级挂载 {@link AddIconDialog}，本组件只负责入口按钮。
 */
export function SiteTileAddAffordance({ onPress, suppress }: SiteTileAddAffordanceProps) {
  if (suppress) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="添加图标"
      className={[
        "glass-site-add-affordance absolute right-0 bottom-0 z-[15] flex h-7 w-7 items-center justify-center rounded-lg text-white/95",
        "opacity-0 translate-y-0.5 pointer-events-none transition-[opacity,transform] duration-300 ease-out",
        "group-hover/site:opacity-100 group-hover/site:translate-y-0 group-hover/site:pointer-events-auto",
        "hover:brightness-110 active:scale-95",
        "shadow-sm",
      ].join(" ")}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPress(e);
      }}
    >
      <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
    </button>
  );
}
