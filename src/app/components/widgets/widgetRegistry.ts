import { lazy } from "react";
import { CalendarCard } from "../CalendarCard";
import type { AddableWidgetType } from "./addableWidgetTypes";
import type { WidgetDefinition, WidgetKind } from "./widgetTypes";

const WeatherCard = lazy(async () => {
  const m = await import("../WeatherCard");
  return { default: m.WeatherCard };
});

export const WIDGET_REGISTRY: Record<WidgetKind, WidgetDefinition> = {
  site: {
    kind: "site",
    surface: "tile",
    defaultShape: { cols: 1, rows: 1 },
    resizable: false,
  },
  weather: {
    kind: "weather",
    surface: "panel",
    defaultShape: { cols: 2, rows: 2 },
    resizable: true,
    renderBody: WeatherCard,
  },
  calendar: {
    kind: "calendar",
    surface: "panel",
    defaultShape: { cols: 2, rows: 2 },
    resizable: true,
    renderBody: CalendarCard,
  },
};

export function getWidgetDefinition(kind: WidgetKind): WidgetDefinition {
  return WIDGET_REGISTRY[kind];
}

/** 运行时安全读取：用于持久化脏数据或未来灰度类型兼容。 */
export function tryGetWidgetDefinition(kind: string): WidgetDefinition | undefined {
  return (WIDGET_REGISTRY as Record<string, WidgetDefinition | undefined>)[kind];
}

export function getWidgetBodyComponent(widgetType: AddableWidgetType) {
  const component = getWidgetDefinition(widgetType).renderBody;
  if (!component) {
    throw new Error(`Widget body component is not registered for: ${widgetType}`);
  }
  return component;
}

