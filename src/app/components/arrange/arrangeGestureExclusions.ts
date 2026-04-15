/**
 * 起手排除规则（Windows 桌面语义）：
 * - 实体本体（网格项）不允许起手框选
 * - 搜索框区域不允许起手框选
 * - 明确标记为排除的区域不允许起手框选（如侧栏）
 * - 常见可交互控件不允许起手框选
 */
export function getArrangeGestureExclusionReason(target: HTMLElement | null): string | null {
  if (!target) return "no-target";
  if (target.closest("[data-grid-item-id]")) return "grid-item";
  if (target.closest("[data-search-bar-root]")) return "search-bar";
  if (target.closest("[data-arrange-gesture-exclude]")) return "explicit-exclude";
  if (target.closest("button,a,input,textarea,select,[contenteditable='true']")) return "interactive-control";
  return null;
}

export function isArrangeGestureExcludedStartTarget(target: HTMLElement | null): boolean {
  return getArrangeGestureExclusionReason(target) !== null;
}
