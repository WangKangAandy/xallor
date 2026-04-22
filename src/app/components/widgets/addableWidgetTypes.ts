/** 通过「添加图标」可直接创建的组件类型（阶段 A 先覆盖 weather/calendar）。 */
export const ADDABLE_WIDGET_TYPES = ["weather", "calendar"] as const;

export type AddableWidgetType = (typeof ADDABLE_WIDGET_TYPES)[number];

