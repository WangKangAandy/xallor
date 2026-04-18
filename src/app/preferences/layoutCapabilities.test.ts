import { describe, expect, it } from "vitest";
import { getLayoutCapabilities } from "./layoutCapabilities";

describe("getLayoutCapabilities", () => {
  /**
   * 目的：极简模式不展示桌面、不允许整理；默认模式允许。
   */
  it("should_match_default_and_minimal_semantics", () => {
    expect(getLayoutCapabilities("default")).toEqual({
      showDesktop: true,
      allowArrange: true,
    });
    expect(getLayoutCapabilities("minimal")).toEqual({
      showDesktop: false,
      allowArrange: false,
    });
  });
});
