import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GridAddSlotCell } from "./GridAddSlotCell";

describe("GridAddSlotCell", () => {
  /**
   * 目的：空位格须带 `group/add-slot` 与添加按钮，供悬停渐显加号；删除站点角标后由本组件单独承担入口。
   */
  it("should_render_add_slot_with_group_hover_and_affordance_class_when_used", () => {
    const html = renderToStaticMarkup(<GridAddSlotCell onOpenAdd={() => {}} />);
    expect(html).toContain("group/add-slot");
    expect(html).toContain("glass-grid-add-affordance");
    expect(html).toContain("添加图标");
  });
});
