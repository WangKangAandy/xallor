import { describe, expect, it } from "vitest";
import { isCenterZone } from "./gridItemDnDHelpers";

/**
 * 目的：固定「中心区 vs 边区」判定，避免 hover/drop 合并与重排逻辑回归。
 */
describe("isCenterZone", () => {
  it("should_return_true_when_pointer_is_in_center_of_rect", () => {
    const rect = { left: 100, top: 50, width: 100, height: 100 };
    expect(isCenterZone(rect, 150, 100, 0.2)).toBe(true);
  });

  it("should_return_false_when_pointer_is_in_left_margin_strip", () => {
    const rect = { left: 0, top: 0, width: 100, height: 100 };
    expect(isCenterZone(rect, 15, 50, 0.2)).toBe(false);
  });
});
