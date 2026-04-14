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

  /**
   * 目的：验证热区悬停能驱动侧栏展开，避免热区存在但交互失效的回归。
   * 预期：mouseenter 后面板 pointer-events 变为 auto；mouseleave 后恢复 none。
   */
  it("should_toggle_sidebar_panel_interactive_state_when_hover_zone_enter_leave", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<Sidebar />);
    });

    const hoverZone = container.querySelector('[data-testid="sidebar-hover-zone"]') as HTMLDivElement | null;
    const panel = container.querySelector(".glass-surface-sidebar") as HTMLDivElement | null;
    expect(hoverZone).not.toBeNull();
    expect(panel).not.toBeNull();
    expect(panel?.style.pointerEvents).toBe("none");

    act(() => {
      hoverZone?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    expect(panel?.style.pointerEvents).toBe("auto");

    act(() => {
      hoverZone?.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    });
    expect(panel?.style.pointerEvents).toBe("none");

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
