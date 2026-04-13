import { describe, expect, it } from "vitest";
import { getWidgetBodyComponent } from "./widgetRegistry";

describe("widgetRegistry getWidgetBodyComponent", () => {
  /**
   * 目的：widget 内容渲染映射集中后，新增类型时能通过测试快速发现遗漏。
   */
  it("should_resolve_body_component_for_each_addable_widget_type", () => {
    const weatherBody = getWidgetBodyComponent("weather");
    const calendarBody = getWidgetBodyComponent("calendar");
    expect(weatherBody).toBeDefined();
    expect(calendarBody).toBeTypeOf("function");
    expect(weatherBody).not.toBe(calendarBody);
  });
});

