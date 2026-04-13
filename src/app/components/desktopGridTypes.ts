export interface Site {
  name: string;
  domain: string;
  url: string;
  /** 与「添加图标」预览一致：0 彩色 / 1 反色 / 2 小图 / 3 占位；缺省为 0 */
  iconVariant?: 0 | 1 | 2 | 3;
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
