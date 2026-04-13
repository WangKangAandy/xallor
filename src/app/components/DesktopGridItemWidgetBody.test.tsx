import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DesktopGridItemWidgetBody } from "./DesktopGridItemWidgetBody";

describe("DesktopGridItemWidgetBody", () => {
  /**
   * 目的：修复“可添加日历但网格不可见”的不一致。
   * 预期：calendar 分支渲染占位文案，至少可见可交互。
   */
  it("should_render_calendar_placeholder_when_widget_type_is_calendar", () => {
    const html = renderToStaticMarkup(<DesktopGridItemWidgetBody widgetType="calendar" />);
    expect(html).toContain("已添加日历组件（占位）");
    expect(html).toContain("日历");
  });
});
