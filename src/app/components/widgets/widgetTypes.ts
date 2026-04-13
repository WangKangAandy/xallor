import type { GridShape } from "../desktopGridTypes";
import type { ComponentType } from "react";

export type WidgetKind = "site" | "weather" | "calendar";

export type WidgetSurfaceVariant = "tile" | "panel";

/**
 * 组件注册定义：集中声明默认尺寸与表现元数据，避免在调用方硬编码。
 */
export type WidgetDefinition = {
  kind: WidgetKind;
  surface: WidgetSurfaceVariant;
  defaultShape: GridShape;
  resizable: boolean;
  /** 内容渲染组件：site 等非 widget 可缺省。 */
  renderBody?: ComponentType<Record<string, never>>;
};

