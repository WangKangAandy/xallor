/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

let mockedResting = false;

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
    }),
  };
});

describe("App sidebar layer", () => {
  let host: HTMLDivElement | null = null;

  afterEach(() => {
    mockedResting = false;
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
});

