import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GridAddSlotCell } from "./GridAddSlotCell";

describe("GridAddSlotCell", () => {
  /**
   * 目的：空位格须带 `group/add-slot` 与中央加号按钮（`aria-label`），供悬停渐显；无额外「添加」文案。
   */
  it("should_render_add_slot_with_group_hover_and_affordance_class_when_used", () => {
    const html = renderToStaticMarkup(<GridAddSlotCell onOpenAdd={() => {}} />);
    expect(html).toContain("group/add-slot");
    expect(html).toContain("添加图标");
    expect(html).toContain("justify-center");
    expect(html).toContain("items-center");
    expect(html).not.toContain("-bottom-7");
  });

  /**
   * 目的：占位毛玻璃默认 opacity-0，非悬停时完全不可见，避免「幽灵框」。
   */
  it("should_hide_placeholder_tile_until_hover_via_opacity_zero", () => {
    const html = renderToStaticMarkup(<GridAddSlotCell onOpenAdd={() => {}} />);
    expect(html).toContain("opacity-0");
    expect(html).not.toContain("opacity-60");
  });
});
