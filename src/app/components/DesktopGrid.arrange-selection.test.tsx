/** @vitest-environment jsdom */
import { act } from "react";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { DesktopGrid } from "./DesktopGrid";
import type { GridItemType } from "./desktopGridTypes";

function ArrangeSelectionHarness({ initialItems }: { initialItems: GridItemType[] }) {
  const [items, setItems] = useState<GridItemType[]>(initialItems);
  return <DesktopGrid items={items} setItems={setItems} showLabels isHydrated />;
}

function dispatchPointerEvent(target: EventTarget, type: string, x: number, y: number, button = 0) {
  target.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button }));
}

describe("DesktopGrid arrange selection trigger", () => {
  /**
   * 目的：保护“从外层空白区域起手框选也能触发”的回归点。
   * 预期：在 dropzone 空白处起手并框住图标后，自动进入整理模式。
   */
  it("should_enter_arrange_mode_when_selection_started_from_dropzone_blank_area_hits_item", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const items: GridItemType[] = [
      {
        id: "site-1",
        type: "site",
        shape: { cols: 1, rows: 1 },
        site: { name: "GitHub", domain: "github.com", url: "https://github.com" },
      },
    ];

    act(() => {
      root.render(<ArrangeSelectionHarness initialItems={items} />);
    });

    const dropzone = container.querySelector('[data-testid="desktop-grid-dropzone"]') as HTMLDivElement | null;
    const item = container.querySelector('[data-grid-item-id="site-1"]') as HTMLDivElement | null;
    expect(dropzone).not.toBeNull();
    expect(item).not.toBeNull();

    Object.defineProperty(item, "getBoundingClientRect", {
      configurable: true,
      value: () =>
        ({
          left: 320,
          top: 220,
          right: 420,
          bottom: 320,
          width: 100,
          height: 100,
          x: 320,
          y: 220,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    act(() => {
      dispatchPointerEvent(dropzone as EventTarget, "pointerdown", 40, 40);
      dispatchPointerEvent(window, "pointermove", 380, 300);
      dispatchPointerEvent(window, "pointerup", 380, 300);
    });

    expect(container.querySelector('button[aria-label="退出整理模式"]')).not.toBeNull();

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  /**
   * 目的：空白矩形无命中时不应误入整理模式。
   */
  it("should_not_enter_arrange_mode_when_selection_has_no_hit_items", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const items: GridItemType[] = [
      {
        id: "site-2",
        type: "site",
        shape: { cols: 1, rows: 1 },
        site: { name: "Notion", domain: "notion.so", url: "https://notion.so" },
      },
    ];

    act(() => {
      root.render(<ArrangeSelectionHarness initialItems={items} />);
    });

    const dropzone = container.querySelector('[data-testid="desktop-grid-dropzone"]') as HTMLDivElement | null;
    const item = container.querySelector('[data-grid-item-id="site-2"]') as HTMLDivElement | null;
    expect(dropzone).not.toBeNull();
    expect(item).not.toBeNull();

    Object.defineProperty(item, "getBoundingClientRect", {
      configurable: true,
      value: () =>
        ({
          left: 500,
          top: 360,
          right: 600,
          bottom: 460,
          width: 100,
          height: 100,
          x: 500,
          y: 360,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    act(() => {
      dispatchPointerEvent(dropzone as EventTarget, "pointerdown", 40, 40);
      dispatchPointerEvent(window, "pointermove", 160, 140);
      dispatchPointerEvent(window, "pointerup", 160, 140);
    });

    expect(container.querySelector('button[aria-label="退出整理模式"]')).toBeNull();

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});

