/** @vitest-environment jsdom */
import { act } from "react";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { describe, expect, it } from "vitest";
import { AppI18nProvider } from "../i18n/AppI18n";
import { UiPreferencesTestProvider } from "../preferences/UiPreferencesTestProvider";
import { useArrangeSession } from "./arrange/useArrangeSession";
import { DesktopGrid } from "./DesktopGrid";
import type { GridItemType } from "./desktopGridTypes";
import { shouldBypassCustomContextMenu } from "./useGridContextMenu";

function ArrangeSelectionHarness({
  initialItems,
  pageId = "test-page",
  enterArrangeModeOnMount = false,
}: {
  initialItems: GridItemType[];
  pageId?: string;
  /** 框选手势已上移到 MultiDesktopStrip；单测内用 session 进入整理态以对齐当前架构。 */
  enterArrangeModeOnMount?: boolean;
}) {
  const [items, setItems] = useState<GridItemType[]>(initialItems);
  const arrangeSession = useArrangeSession();
  const { enterArrangeMode } = arrangeSession;

  useEffect(() => {
    if (!enterArrangeModeOnMount) return;
    enterArrangeMode(pageId);
  }, [enterArrangeModeOnMount, pageId, enterArrangeMode]);

  return (
    <DndProvider backend={HTML5Backend}>
      <AppI18nProvider>
        <UiPreferencesTestProvider>
          <DesktopGrid
            pageId={pageId}
            arrangeSession={arrangeSession}
            items={items}
            setItems={setItems}
            showLabels
            isHydrated
          />
        </UiPreferencesTestProvider>
      </AppI18nProvider>
    </DndProvider>
  );
}

function dispatchPointerEvent(target: EventTarget, type: string, x: number, y: number, button = 0) {
  target.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button }));
}

function dispatchContextMenu(target: EventTarget, x: number, y: number) {
  target.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 2 }));
}

describe("DesktopGrid arrange selection trigger", () => {
  /**
   * 目的：进入整理模式后应出现「退出整理模式」入口（框选手势由 MultiDesktopStrip 统一监听，见 e2e）。
   */
  it("should_show_exit_arrange_button_when_arrange_mode_active", () => {
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
      root.render(<ArrangeSelectionHarness initialItems={items} enterArrangeModeOnMount />);
    });

    const dropzone = container.querySelector('[data-testid="desktop-grid-dropzone"]') as HTMLDivElement | null;
    const item = container.querySelector('[data-grid-item-id="site-1"]') as HTMLDivElement | null;
    expect(dropzone).not.toBeNull();
    expect(item).not.toBeNull();

    expect(container.querySelector('button[aria-label="退出整理模式"]')).not.toBeNull();

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  /**
   * 目的：整理模式下应禁用站点卡片自定义右键菜单，避免与整理交互冲突。
   * 前置：站点卡片存在，且会话已进入整理模式。
   * 预期：右击站点后不渲染 `data-grid-context-menu`。
   */
  it("should_not_open_item_context_menu_for_site_when_arrange_mode_active", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const items: GridItemType[] = [
      {
        id: "site-rm-1",
        type: "site",
        shape: { cols: 1, rows: 1 },
        site: { name: "GitHub", domain: "github.com", url: "https://github.com" },
      },
    ];

    act(() => {
      root.render(<ArrangeSelectionHarness initialItems={items} enterArrangeModeOnMount />);
    });

    const siteItem = container.querySelector('[data-grid-item-id="site-rm-1"]') as HTMLDivElement | null;
    expect(siteItem).not.toBeNull();
    act(() => {
      dispatchContextMenu(siteItem as EventTarget, 260, 200);
    });
    expect(document.body.querySelector("[data-grid-context-menu]")).toBeNull();

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  /**
   * 目的：整理模式下应禁用组件卡片自定义右键菜单，保证统一“右键不弹菜单”策略。
   * 前置：组件卡片存在，且会话已进入整理模式。
   * 预期：右击组件后不渲染 `data-grid-context-menu`。
   */
  it("should_not_open_item_context_menu_for_widget_when_arrange_mode_active", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const items: GridItemType[] = [
      {
        id: "widget-rm-1",
        type: "widget",
        shape: { cols: 2, rows: 2 },
        widgetType: "weather",
      },
    ];

    act(() => {
      root.render(<ArrangeSelectionHarness initialItems={items} enterArrangeModeOnMount />);
    });

    const widgetItem = container.querySelector('[data-grid-item-id="widget-rm-1"]') as HTMLDivElement | null;
    expect(widgetItem).not.toBeNull();
    act(() => {
      dispatchContextMenu(widgetItem as EventTarget, 280, 220);
    });
    expect(document.body.querySelector("[data-grid-context-menu]")).toBeNull();

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  /**
   * 目的：整理模式下网格域应统一标记为 context-disabled，供空白区右键入口复用同一开关。
   * 前置：进入整理模式并定位网格容器中的普通子元素。
   * 预期：容器存在 `data-context-disabled="true"`，且 `shouldBypassCustomContextMenu` 返回 true。
   */
  it("should_mark_grid_surface_as_context_disabled_when_arrange_mode_active", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const items: GridItemType[] = [
      {
        id: "site-rm-2",
        type: "site",
        shape: { cols: 1, rows: 1 },
        site: { name: "CodePen", domain: "codepen.io", url: "https://codepen.io" },
      },
    ];

    act(() => {
      root.render(<ArrangeSelectionHarness initialItems={items} enterArrangeModeOnMount />);
    });

    const contextDisabledRoot = container.querySelector('[data-context-disabled="true"]') as HTMLDivElement | null;
    expect(contextDisabledRoot).not.toBeNull();
    const probe = document.createElement("span");
    contextDisabledRoot?.appendChild(probe);
    expect(shouldBypassCustomContextMenu(probe)).toBe(true);

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
      root.render(<ArrangeSelectionHarness initialItems={items} enterArrangeModeOnMount />);
    });

    const dropzone = container.querySelector('[data-testid="desktop-grid-dropzone"]') as HTMLDivElement | null;
    const folder = container.querySelector('[data-grid-item-id="folder-1"]') as HTMLDivElement | null;
    expect(dropzone).not.toBeNull();
    expect(folder).not.toBeNull();

    expect(container.querySelector('button[aria-label="退出整理模式"]')).not.toBeNull();

    act(() => {
      (folder as HTMLDivElement).click();
    });
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

