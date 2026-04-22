import { describe, expect, it } from "vitest";
import { canRenderWidgetInGrid, getGridRenderableKind } from "./WidgetRenderer";
import type { GridItemType } from "../desktopGridTypes";

describe("WidgetRenderer", () => {
  /**
   * 目的：阶段 C 初步切换渲染入口时，保持 legacy 三类 item 到渲染 kind 的映射稳定。
   */
  it("should_return_same_renderable_kind_for_legacy_item_types", () => {
    const site: GridItemType = {
      id: "s1",
      type: "site",
      shape: { cols: 1, rows: 1 },
      site: { name: "GitHub", domain: "github.com", url: "https://github.com" },
    };
    const folder: GridItemType = {
      id: "f1",
      type: "folder",
      shape: { cols: 2, rows: 2 },
      name: "工作",
      colorFrom: "rgba(147,197,253,0.75)",
      colorTo: "rgba(99,102,241,0.75)",
      sites: [{ name: "A", domain: "a.com", url: "https://a.com" }],
    };
    const widget: GridItemType = {
      id: "w1",
      type: "widget",
      widgetType: "weather",
      shape: { cols: 2, rows: 2 },
    };

    expect(getGridRenderableKind(site)).toBe("site");
    expect(getGridRenderableKind(folder)).toBe("folder");
    expect(getGridRenderableKind(widget)).toBe("widget");
  });

  /**
   * 目的：widget 渲染入口通过 registry 判定可渲染性，防止未知类型导致运行时异常。
   */
  it("should_allow_registered_widget_types_and_reject_unknown_type", () => {
    expect(canRenderWidgetInGrid("weather")).toBe(true);
    expect(canRenderWidgetInGrid("calendar")).toBe(true);
    expect(canRenderWidgetInGrid("unknown-widget")).toBe(false);
  });
});

