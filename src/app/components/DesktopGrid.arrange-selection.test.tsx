/** @vitest-environment jsdom */
import { act } from "react";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { useArrangeSession } from "./arrange/useArrangeSession";
import { DesktopGrid } from "./DesktopGrid";
import type { GridItemType } from "./desktopGridTypes";

function ArrangeSelectionHarness({ initialItems }: { initialItems: GridItemType[] }) {
  const [items, setItems] = useState<GridItemType[]>(initialItems);
  const arrangeSession = useArrangeSession();
  return <DesktopGrid arrangeSession={arrangeSession} items={items} setItems={setItems} showLabels isHydrated />;
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

  /**
   * 目的：Windows 风格语义下，实体本体不作为起手触发区；从卡片表面起手不应触发整理模式。
   */
  it("should_not_enter_arrange_mode_when_drag_started_from_grid_item_surface", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const items: GridItemType[] = [
      {
        id: "site-3",
        type: "site",
        shape: { cols: 1, rows: 1 },
        site: { name: "YouTube", domain: "youtube.com", url: "https://youtube.com" },
      },
    ];

    act(() => {
      root.render(<ArrangeSelectionHarness initialItems={items} />);
    });

    const item = container.querySelector('[data-grid-item-id="site-3"]') as HTMLDivElement | null;
    expect(item).not.toBeNull();

    Object.defineProperty(item, "getBoundingClientRect", {
      configurable: true,
      value: () =>
        ({
          left: 240,
          top: 180,
          right: 340,
          bottom: 280,
          width: 100,
          height: 100,
          x: 240,
          y: 180,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    act(() => {
      dispatchPointerEvent(item as EventTarget, "pointerdown", 260, 200);
      dispatchPointerEvent(window, "pointermove", 420, 360);
      dispatchPointerEvent(window, "pointerup", 420, 360);
    });

    expect(container.querySelector('button[aria-label="退出整理模式"]')).toBeNull();

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  /**
   * 目的：整理模式下文件夹卡片点击应仅切换选中；需通过“展开整理”按钮进入内部整理态。
   */
  it("should_open_folder_only_when_expand_arrange_button_clicked_in_arrange_mode", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const items: GridItemType[] = [
      {
        id: "folder-1",
        type: "folder",
        shape: { cols: 2, rows: 1 },
        name: "社交",
        colorFrom: "rgba(147,197,253,0.75)",
        colorTo: "rgba(99,102,241,0.75)",
        sites: [
          { name: "X", domain: "x.com", url: "https://x.com" },
          { name: "Discord", domain: "discord.com", url: "https://discord.com" },
        ],
      },
    ];

    act(() => {
      root.render(<ArrangeSelectionHarness initialItems={items} />);
    });

    const dropzone = container.querySelector('[data-testid="desktop-grid-dropzone"]') as HTMLDivElement | null;
    const folder = container.querySelector('[data-grid-item-id="folder-1"]') as HTMLDivElement | null;
    expect(dropzone).not.toBeNull();
    expect(folder).not.toBeNull();

    Object.defineProperty(folder, "getBoundingClientRect", {
      configurable: true,
      value: () =>
        ({
          left: 320,
          top: 220,
          right: 520,
          bottom: 320,
          width: 200,
          height: 100,
          x: 320,
          y: 220,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    act(() => {
      dispatchPointerEvent(dropzone as EventTarget, "pointerdown", 40, 40);
      dispatchPointerEvent(window, "pointermove", 380, 280);
      dispatchPointerEvent(window, "pointerup", 380, 280);
    });

    expect(container.querySelector('button[aria-label="退出整理模式"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="展开整理"]')).not.toBeNull();

    // 仅点击文件夹卡片本体，不应直接展开内部整理态。
    act(() => {
      (folder as HTMLDivElement).click();
    });
    expect(document.body.querySelector(".glass-scrim")).toBeNull();
    expect(container.querySelector('button[aria-label="展开整理"]')).toBeNull();

    // 再次点击恢复选中后，展开按钮应重新出现。
    act(() => {
      (folder as HTMLDivElement).click();
    });

    // 点击“展开整理”按钮后才进入内部整理态。
    const openArrangeBtn = container.querySelector('button[aria-label="展开整理"]') as HTMLButtonElement | null;
    expect(openArrangeBtn).not.toBeNull();
    act(() => {
      openArrangeBtn?.click();
    });
    expect(document.body.querySelector(".glass-scrim")).not.toBeNull();

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});

