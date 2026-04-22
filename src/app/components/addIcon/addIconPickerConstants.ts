/** 左栏数据源筛选（壳子阶段仅占位，后续接真实列表）。 */
export type AddIconPickerFilter = "all" | "sites" | "components";

export const ADD_ICON_PICKER_FILTERS: { id: AddIconPickerFilter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "sites", label: "站点" },
  { id: "components", label: "组件" },
];
