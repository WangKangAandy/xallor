import type { AddIconSubmitPayload } from "../addIcon/addIconSubmitPayload";
import type { GridItemType, SiteItem, WidgetItem } from "../desktopGridTypes";
import { getWidgetDefinition } from "./widgetRegistry";

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * 将「添加图标」提交载荷转换为网格项。
 * 阶段 A：集中默认 shape 与 kind 映射，去除 DesktopGrid 内部硬编码分支。
 */
export function createGridItemFromAddPayload(payload: AddIconSubmitPayload): GridItemType {
  if (payload.kind === "site") {
    const def = getWidgetDefinition("site");
    const siteItem: SiteItem = {
      id: nextId("site"),
      type: "site",
      shape: def.defaultShape,
      site: payload.site,
    };
    return siteItem;
  }

  const def = getWidgetDefinition(payload.widgetType);
  const widgetItem: WidgetItem = {
    id: nextId("widget"),
    type: "widget",
    widgetType: payload.widgetType,
    shape: def.defaultShape,
  };
  return widgetItem;
}

