import { getComponentCatalogSearchHaystack, type MessageKey } from "../../i18n/AppI18n";
import type { AddIconPickerFilter } from "./addIconPickerConstants";
import { ADDABLE_WIDGET_TYPES, type AddableWidgetType } from "../widgets/addableWidgetTypes";

/** 可添加的站点（来自内置目录，后续可换 API）。 */
export type AddIconCatalogSite = {
  kind: "site";
  id: string;
  name: string;
  domain: string;
  url: string;
};

/** 可添加的桌面组件。 */
export type AddIconCatalogComponent = {
  kind: "component";
  id: string;
  nameKey: MessageKey;
  subtitleKey: MessageKey;
  widgetType: AddableWidgetType;
};

export type AddIconCatalogEntry = AddIconCatalogSite | AddIconCatalogComponent;

/** 内置演示目录（与图二「左栏网格」对应，仅占位数据）。 */
const ADD_ICON_COMPONENT_META: Record<
  AddableWidgetType,
  { id: string; nameKey: MessageKey; subtitleKey: MessageKey }
> = {
  weather: {
    id: "cat-widget-weather",
    nameKey: "addIcon.widgetWeatherName",
    subtitleKey: "addIcon.widgetWeatherSubtitle",
  },
  calendar: {
    id: "cat-widget-calendar",
    nameKey: "addIcon.widgetCalendarName",
    subtitleKey: "addIcon.widgetCalendarSubtitle",
  },
};

const ADD_ICON_COMPONENT_CATALOG: AddIconCatalogComponent[] = ADDABLE_WIDGET_TYPES.map((widgetType) => ({
  kind: "component",
  widgetType,
  ...ADD_ICON_COMPONENT_META[widgetType],
}));

export const ADD_ICON_CATALOG: AddIconCatalogEntry[] = [
  {
    kind: "site",
    id: "cat-site-github",
    name: "GitHub",
    domain: "github.com",
    url: "https://github.com",
  },
  {
    kind: "site",
    id: "cat-site-youtube",
    name: "YouTube",
    domain: "youtube.com",
    url: "https://youtube.com",
  },
  {
    kind: "site",
    id: "cat-site-google",
    name: "Google",
    domain: "google.com",
    url: "https://google.com",
  },
  {
    kind: "site",
    id: "cat-site-notion",
    name: "Notion",
    domain: "notion.so",
    url: "https://notion.so",
  },
  {
    kind: "site",
    id: "cat-site-x",
    name: "X",
    domain: "x.com",
    url: "https://x.com",
  },
  {
    kind: "site",
    id: "cat-site-bilibili",
    name: "哔哩哔哩",
    domain: "bilibili.com",
    url: "https://bilibili.com",
  },
  ...ADD_ICON_COMPONENT_CATALOG,
];

function matchesFilter(entry: AddIconCatalogEntry, filter: AddIconPickerFilter): boolean {
  if (filter === "all") return true;
  if (filter === "sites") return entry.kind === "site";
  return entry.kind === "component";
}

function matchesSearch(entry: AddIconCatalogEntry, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  if (entry.kind === "site") {
    return (
      entry.name.toLowerCase().includes(s) ||
      entry.domain.toLowerCase().includes(s)
    );
  }
  const haystack = getComponentCatalogSearchHaystack(entry.nameKey, entry.subtitleKey);
  return haystack.includes(s);
}

/**
 * 按筛选与搜索关键字过滤目录（纯函数，供列表与测试复用）。
 */
export function filterAddIconCatalog(
  entries: AddIconCatalogEntry[],
  filter: AddIconPickerFilter,
  searchQuery: string,
): AddIconCatalogEntry[] {
  return entries.filter((e) => matchesFilter(e, filter) && matchesSearch(e, searchQuery));
}
