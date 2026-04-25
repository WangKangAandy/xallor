/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppI18nProvider } from "../i18n/AppI18n";
import { UiPreferencesProvider } from "../preferences";
import type { MinimalDockSiteEntry } from "./minimalDockTypes";
import { MinimalDockBar } from "./MinimalDockBar";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("MinimalDockBar context menu", () => {
  const entry: MinimalDockSiteEntry = {
    kind: "site",
    id: "dock-a",
    site: { name: "TestSite", domain: "test.example", url: "https://test.example/" },
  };

  afterEach(() => {
    document.body.innerHTML = "";
  });

  /**
   * 目的：Dock 站点槽应挂载与网格一致的自定义右键菜单（含「隐藏」等项）。
   * 前置：极简 Dock 有一条站点；在槽上触发 contextmenu。
   * 预期：Portal 中出现 data-grid-context-menu 且含「隐藏」文案。
   */
  it("should_open_grid_style_context_menu_when_right_clicking_dock_site_slot", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <UiPreferencesProvider>
          <AppI18nProvider>
            <DndProvider backend={HTML5Backend}>
              <MinimalDockBar
                entries={[entry]}
                onReorder={vi.fn()}
                onOpenWidgets={vi.fn()}
                isCustomContextMenuEnabled
                onDockSiteDelete={vi.fn()}
                onDockSiteHide={vi.fn()}
                onDockEnterArrangeMode={vi.fn()}
              />
            </DndProvider>
          </AppI18nProvider>
        </UiPreferencesProvider>,
      );
    });

    const slot = container.querySelector("[data-testid=\"minimal-dock-site-slot\"]") as HTMLElement | null;
    expect(slot).toBeTruthy();
    await act(async () => {
      slot!.dispatchEvent(
        new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 40, clientY: 40 }),
      );
    });

    const menu = document.body.querySelector("[data-grid-context-menu]");
    expect(menu).toBeTruthy();
    expect(menu?.textContent).toMatch(/隐藏/);
    root.unmount();
    document.body.removeChild(container);
  });
});
