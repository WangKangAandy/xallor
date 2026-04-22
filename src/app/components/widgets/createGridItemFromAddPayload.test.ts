import { describe, expect, it } from "vitest";
import { createGridItemFromAddPayload } from "./createGridItemFromAddPayload";

describe("createGridItemFromAddPayload", () => {
  /**
   * 目的：site 载荷应映射为单格 site item，避免调用方硬编码 shape。
   */
  it("should_create_site_item_with_registry_shape_when_payload_is_site", () => {
    const item = createGridItemFromAddPayload({
      kind: "site",
      site: {
        name: "GitHub",
        domain: "github.com",
        url: "https://github.com",
      },
    });

    expect(item.type).toBe("site");
    expect(item.shape).toEqual({ cols: 1, rows: 1 });
  });

  /**
   * 目的：calendar/weather 载荷均走 widget registry 默认尺寸，避免各处重复 2x2 魔法数。
   */
  it("should_create_widget_item_with_registry_shape_when_payload_is_component", () => {
    const item = createGridItemFromAddPayload({
      kind: "component",
      widgetType: "calendar",
    });

    expect(item.type).toBe("widget");
    if (item.type === "widget") {
      expect(item.widgetType).toBe("calendar");
      expect(item.shape).toEqual({ cols: 2, rows: 2 });
    }
  });
});

