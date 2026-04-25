/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AppI18nProvider } from "../i18n/AppI18n";
import { UiPreferencesProvider } from "../preferences";
import { AppMinimalDockLayer } from "./AppMinimalDockLayer";
import type { MinimalDockSiteEntry } from "../minimalDock/minimalDockTypes";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("AppMinimalDockLayer", () => {
  const originalMatchMedia = window.matchMedia;

  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: "(prefers-reduced-motion: reduce)",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: originalMatchMedia,
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  function renderLayer(minimalDockEntries: MinimalDockSiteEntry[] = []) {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      root.render(
        <UiPreferencesProvider>
          <AppI18nProvider>
            <AppMinimalDockLayer
              layoutMode="minimal"
              minimalDockMode="auto_hide"
              minimalDockEntries={minimalDockEntries}
              forceDockVisibleInAutoHide={false}
              dockFullPulseSeq={0}
              onMinimalDockReorder={vi.fn()}
              openSettingsWidgets={vi.fn()}
              isCustomContextMenuEnabled
              onMinimalDockDeleteSiteEntry={vi.fn()}
              onMinimalDockHideSiteEntry={vi.fn()}
              onMinimalDockEnterArrangeMode={vi.fn()}
            />
          </AppI18nProvider>
        </UiPreferencesProvider>,
      );
    });
    return { container, root };
  }

  /**
   * 目的：当 Dock 为空时，即使模式为 auto_hide，也应固定显示加号入口。
   * 前置：minimal + auto_hide + entries 为空。
   * 预期：不渲染 hover shell，直接渲染 dock bar。
   */
  it("should_render_dock_bar_without_hover_shell_when_auto_hide_mode_has_no_entries", () => {
    const { root, container } = renderLayer([]);
    expect(container.querySelector("[data-testid='minimal-dock-bar']")).toBeTruthy();
    expect(container.querySelector("[data-testid='minimal-dock-hover-shell']")).toBeNull();
    root.unmount();
  });

  /**
   * 目的：当 Dock 有站点时，auto_hide 仍应维持悬停唤起交互。
   * 前置：minimal + auto_hide + 含一条 site entry。
   * 预期：渲染 hover shell。
   */
  it("should_render_hover_shell_when_auto_hide_mode_has_site_entries", () => {
    const entries: MinimalDockSiteEntry[] = [
      {
        kind: "site",
        id: "dock-entry-1",
        site: { name: "Test", domain: "test.example", url: "https://test.example/" },
      },
    ];
    const { root, container } = renderLayer(entries);
    expect(container.querySelector("[data-testid='minimal-dock-hover-shell']")).toBeTruthy();
    root.unmount();
  });

  /**
   * 目的：设置页位于「站点与组件」分区时，auto_hide 仍应复用 hover shell 动画，仅强制保持展开。
   * 前置：minimal + auto_hide + 含站点 + forceDockVisibleInAutoHide=true。
   * 预期：继续渲染 hover shell（不切分支直出 DockBar）。
   */
  it("should_keep_hover_shell_when_widgets_settings_requests_force_visible", () => {
    const entries: MinimalDockSiteEntry[] = [
      {
        kind: "site",
        id: "dock-entry-2",
        site: { name: "KeepVisible", domain: "visible.example", url: "https://visible.example/" },
      },
    ];
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      root.render(
        <UiPreferencesProvider>
          <AppI18nProvider>
            <AppMinimalDockLayer
              layoutMode="minimal"
              minimalDockMode="auto_hide"
              minimalDockEntries={entries}
              forceDockVisibleInAutoHide
              dockFullPulseSeq={0}
              onMinimalDockReorder={vi.fn()}
              openSettingsWidgets={vi.fn()}
              isCustomContextMenuEnabled
              onMinimalDockDeleteSiteEntry={vi.fn()}
              onMinimalDockHideSiteEntry={vi.fn()}
              onMinimalDockEnterArrangeMode={vi.fn()}
            />
          </AppI18nProvider>
        </UiPreferencesProvider>,
      );
    });
    expect(container.querySelector("[data-testid='minimal-dock-hover-shell']")).toBeTruthy();
    expect(container.querySelector("[data-testid='minimal-dock-bar']")).toBeTruthy();
    root.unmount();
    document.body.removeChild(container);
  });

  /**
   * 目的：常驻模式且 Dock 为空时，底部应保留可见的加号入口。
   * 前置：minimal + pinned + entries 为空。
   * 预期：渲染 dock bar 与 add 入口，不渲染 hover shell。
   */
  it("should_keep_add_entry_visible_when_pinned_mode_has_no_entries", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      root.render(
        <UiPreferencesProvider>
          <AppI18nProvider>
            <AppMinimalDockLayer
              layoutMode="minimal"
              minimalDockMode="pinned"
              minimalDockEntries={[]}
              forceDockVisibleInAutoHide={false}
              dockFullPulseSeq={0}
              onMinimalDockReorder={vi.fn()}
              openSettingsWidgets={vi.fn()}
              isCustomContextMenuEnabled
              onMinimalDockDeleteSiteEntry={vi.fn()}
              onMinimalDockHideSiteEntry={vi.fn()}
              onMinimalDockEnterArrangeMode={vi.fn()}
            />
          </AppI18nProvider>
        </UiPreferencesProvider>,
      );
    });
    expect(container.querySelector("[data-testid='minimal-dock-bar']")).toBeTruthy();
    expect(container.querySelector("[data-testid='minimal-dock-add-outer']")).toBeTruthy();
    expect(container.querySelector("[data-testid='minimal-dock-hover-shell']")).toBeNull();
    root.unmount();
    document.body.removeChild(container);
  });
});
