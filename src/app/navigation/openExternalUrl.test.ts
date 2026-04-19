/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { openExternalUrlImpl } from "./openExternalUrl";

describe("openExternalUrlImpl", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * 目的：新标签须走 window.open；当前标签须走 location.assign，避免业务散落两套 API。
   */
  it("should_call_window_open_when_openInNewTab_true", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    openExternalUrlImpl("https://example.com", { openInNewTab: true });
    expect(open).toHaveBeenCalledWith("https://example.com", "_blank", "noopener,noreferrer");
  });

  it("should_call_location_assign_when_openInNewTab_false", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { assign } as unknown as Location);
    openExternalUrlImpl("https://example.com", { openInNewTab: false });
    expect(assign).toHaveBeenCalledWith("https://example.com");
    vi.unstubAllGlobals();
  });
});
