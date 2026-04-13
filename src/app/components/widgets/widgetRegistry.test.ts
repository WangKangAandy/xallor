import { describe, expect, it } from "vitest";
import { ADDABLE_WIDGET_TYPES } from "./addableWidgetTypes";
import { getWidgetDefinition } from "./widgetRegistry";

describe("widgetRegistry", () => {
  /**
   * 目的：防止新增 addable widget 后忘记注册，导致添加链路运行时失败。
   * 预期：每个 addable 类型都能取到定义，且默认尺寸为正值。
   */
  it("should_register_every_addable_widget_type_with_valid_default_shape", () => {
    for (const widgetType of ADDABLE_WIDGET_TYPES) {
      const def = getWidgetDefinition(widgetType);
      expect(def).toBeDefined();
      expect(def.defaultShape.cols).toBeGreaterThan(0);
      expect(def.defaultShape.rows).toBeGreaterThan(0);
    }
  });
});

