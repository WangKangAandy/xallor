export type WidgetLayoutMode = "floating" | "pinned";
export type WidgetCompactionStrategy = "compact" | "no-compact";
export type WidgetConflictStrategy = "swap" | "reject" | "eject";

/**
 * 组件布局语义（阶段 B 并存）：对齐后续 RGL `x/y/w/h` 形状。
 */
export type WidgetLayout = {
  /** 与组件 id 对齐 */
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  mode: WidgetLayoutMode;
  resizable: boolean;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
};

export type WidgetPageLayoutState = {
  widgets: string[];
  layout: WidgetLayout[];
  /** 重排策略：compact=自动补位；no-compact=固定不补位。 */
  compactionStrategy?: WidgetCompactionStrategy;
  /** 冲突策略：swap=交换、reject=拒绝、eject=挤出（当前默认行为）。 */
  conflictStrategy?: WidgetConflictStrategy;
  /**
   * @deprecated 请改用 compactionStrategy；保留用于旧数据兼容。
   * 自动补位（紧凑重排）开关：
   * - true: 维持当前 hover 边区自动重排体验；
   * - false: 禁用自动补位，配合 pinned 组件保持位置稳定。
   */
  autoCompactEnabled?: boolean;
};

export function resolveCompactionStrategy(layout?: WidgetPageLayoutState): WidgetCompactionStrategy {
  if (layout?.compactionStrategy === "compact" || layout?.compactionStrategy === "no-compact") {
    return layout.compactionStrategy;
  }
  if (layout?.autoCompactEnabled === false) return "no-compact";
  return "compact";
}

export function resolveConflictStrategy(layout?: WidgetPageLayoutState): WidgetConflictStrategy {
  if (layout?.conflictStrategy === "swap" || layout?.conflictStrategy === "reject" || layout?.conflictStrategy === "eject") {
    return layout.conflictStrategy;
  }
  return "eject";
}

export function isValidWidgetLayout(value: unknown): value is WidgetLayout {
  if (!value || typeof value !== "object") return false;
  const v = value as WidgetLayout;
  const hasNums = [v.x, v.y, v.w, v.h].every((n) => Number.isInteger(n) && n >= 0);
  return (
    typeof v.id === "string" &&
    v.id.length > 0 &&
    hasNums &&
    (v.mode === "floating" || v.mode === "pinned") &&
    typeof v.resizable === "boolean"
  );
}

