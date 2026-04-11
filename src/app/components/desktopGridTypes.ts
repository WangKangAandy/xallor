export interface Site {
  name: string;
  domain: string;
  url: string;
}

export type GridShape = { cols: number; rows: number };

export interface BaseItem {
  id: string;
  shape: GridShape;
}

export interface SiteItem extends BaseItem {
  type: "site";
  site: Site;
}

export interface FolderItem extends BaseItem {
  type: "folder";
  name: string;
  colorFrom: string;
  colorTo: string;
  sites: Site[];
}

export interface WidgetItem extends BaseItem {
  type: "widget";
  widgetType: "weather" | "calendar";
}

export type GridItemType = SiteItem | FolderItem | WidgetItem;
