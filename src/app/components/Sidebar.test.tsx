/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { describe, expect, it } from "vitest";
import { createRoot } from "react-dom/client";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  /**
   * 目的：悬停区为单一容器并带 mouseleave；热区高度与侧栏一致（非全屏左侧）。
   * 预期：挂载后存在 sidebar-hover-zone 节点。
   */
  it("should_render_unified_hover_zone_for_mouse_enter_leave", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<Sidebar />);
    });

    expect(document.querySelector('[data-testid="sidebar-hover-zone"]')).not.toBeNull();

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
