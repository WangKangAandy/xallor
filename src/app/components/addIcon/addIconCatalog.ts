import type { AddIconPickerFilter } from "./addIconPickerConstants";

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
  name: string;
  subtitle: string;
  widgetType: "weather" | "calendar";
};

export type AddIconCatalogEntry = AddIconCatalogSite | AddIconCatalogComponent;

/** 内置演示目录（与图二「左栏网格」对应，仅占位数据）。 */
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
    kind: "component",
    id: "cat-widget-weather",
    name: "天气",
    subtitle: "实时天气",
    widgetType: "weather",
  },
  {
    kind: "component",
    id: "cat-widget-calendar",
    name: "日历",
    subtitle: "月视图",
    widgetType: "calendar",
  },
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
  return entry.name.toLowerCase().includes(s) || entry.subtitle.toLowerCase().includes(s);
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
