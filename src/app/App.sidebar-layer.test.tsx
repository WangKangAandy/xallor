/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

let mockedResting = false;
let triggerArrangeModeChange: ((isArrangeMode: boolean) => void) | null = null;
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock("./useRestModeController", () => ({
  useRestModeController: () => ({
    isResting: mockedResting,
    handleDoubleClickCapture: vi.fn(),
  }),
}));

vi.mock("./preferences", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./preferences")>();
  return {
    ...actual,
    useUiPreferences: () => ({
      layoutMode: "default" as const,
      setLayoutMode: vi.fn(),
      openLinksInNewTab: true,
      setOpenLinksInNewTab: vi.fn(),
      colorScheme: "system" as const,
      setColorScheme: vi.fn(),
      sidebarLayout: "always-visible" as const,
      setSidebarLayout: vi.fn(),
      selectedSearchEngineId: "baidu",
      setSearchEngine: vi.fn(),
      gridItemNamesVisible: true,
      setGridItemNamesVisible: vi.fn(),
      minimalDockMode: "auto_hide" as const,
      setMinimalDockMode: vi.fn(),
    }),
  };
});

vi.mock("./appShell/AppLazyParts", () => ({
  SearchBarLazy: () => <div data-testid="mock-search-bar" />,
  MultiDesktopStripLazy: (props: { onArrangeModeChange?: (isArrangeMode: boolean) => void }) => {
    triggerArrangeModeChange = props.onArrangeModeChange ?? null;
    return <div data-testid="mock-desktop-strip" />;
  },
  SidebarLazy: () => <div data-testid="mock-sidebar" />,
  SearchBarFallback: () => <div data-testid="mock-search-fallback" />,
  SidebarFallback: () => <div data-testid="mock-sidebar-fallback" />,
  MultiDesktopFallback: () => <div data-testid="mock-desktop-fallback" />,
}));

vi.mock("./components/SettingsSpotlightModal", () => ({
  SettingsSpotlightModal: () => null,
}));

describe("App sidebar layer", () => {
  let host: HTMLDivElement | null = null;

  afterEach(() => {
    mockedResting = false;
    triggerArrangeModeChange = null;
    if (host) {
      host.remove();
      host = null;
    }
  });

  /**
   * 目的：防止侧栏包裹层再次引入 translate，破坏 fixed 参照系导致侧栏热区错位。
   * 预期：清醒/小憩态都不应包含 translate-x 类名。
   */
  it(
    "should_not_apply_translate_classes_on_sidebar_layer_in_any_rest_state",
    async () => {
    const mod = await import("./App");
    const App = mod.default;
    host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);

    act(() => {
      mockedResting = false;
      root.render(<App />);
    });
    const awakeLayer = host.querySelector('[data-testid="sidebar-layer"]') as HTMLDivElement | null;
    expect(awakeLayer).not.toBeNull();
    expect(awakeLayer?.className.includes("translate-x")).toBe(false);

    act(() => {
      mockedResting = true;
      root.render(<App />);
    });
    const restingLayer = host.querySelector('[data-testid="sidebar-layer"]') as HTMLDivElement | null;
    expect(restingLayer).not.toBeNull();
    expect(restingLayer?.className.includes("translate-x")).toBe(false);

    act(() => {
      root.unmount();
    });
  },
    15_000,
  );

  /**
   * 目的：整理态切换应通过统一开关禁用主列自定义右键菜单，避免散落判断。
   * 前置：渲染 App 后触发 MultiDesktopStrip 的 onArrangeModeChange(true)。
   * 预期：`app-main-content-column` 挂载 `data-context-disabled="true"`（背景菜单监听上提至主列容器）。
   */
  it("should_toggle_desktop_context_disabled_flag_when_arrange_mode_changes", async () => {
    const mod = await import("./App");
    const App = mod.default;
    host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);

    act(() => {
      root.render(<App />);
    });
    const mainColumn = host.querySelector('[data-testid="app-main-content-column"]') as HTMLDivElement | null;
    expect(mainColumn).not.toBeNull();
    expect(mainColumn?.getAttribute("data-context-disabled")).toBeNull();

    act(() => {
      triggerArrangeModeChange?.(true);
    });
    expect(mainColumn?.getAttribute("data-context-disabled")).toBe("true");

    act(() => {
      triggerArrangeModeChange?.(false);
    });
    expect(mainColumn?.getAttribute("data-context-disabled")).toBeNull();

    act(() => {
      root.unmount();
    });
  });
});

