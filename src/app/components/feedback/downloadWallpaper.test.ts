/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadWallpaper, getCurrentWallpaperSource } from "./downloadWallpaper";

const realFetch = globalThis.fetch;
const realOpen = globalThis.open;

describe("downloadWallpaper", () => {
  afterEach(() => {
    globalThis.fetch = realFetch;
    globalThis.open = realOpen;
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  /**
   * 目的：fetch + blob 成功时应走下载分支。
   */
  it("should_return_download_mode_when_fetch_and_blob_succeed", async () => {
    const blob = new Blob(["abc"], { type: "image/png" });
    globalThis.fetch = vi.fn(async () => {
      return new Response(blob, { status: 200, headers: { "content-type": "image/png" } });
    }) as typeof fetch;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const result = await downloadWallpaper({ kind: "image", url: "https://example.com/bg.png" });

    expect(result).toEqual({ ok: true, mode: "download" });
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  /**
   * 目的：fetch 失败时应回退到打开原图。
   */
  it("should_return_fallback_opened_when_fetch_fails_and_window_open_succeeds", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("network");
    }) as typeof fetch;
    globalThis.open = vi.fn(() => window) as typeof window.open;

    const result = await downloadWallpaper({ kind: "unknown", url: "https://example.com/bg" });

    expect(result).toEqual({ ok: true, mode: "fallback-opened" });
  });

  /**
   * 目的：回退打开也失败时，返回 popup-blocked。
   */
  it("should_return_popup_blocked_when_fallback_open_is_blocked", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("cors");
    }) as typeof fetch;
    globalThis.open = vi.fn(() => null) as typeof window.open;

    const result = await downloadWallpaper({ kind: "video", url: "https://example.com/bg.mp4" });

    expect(result).toEqual({ ok: false, reason: "popup-blocked" });
  });

  /**
   * 目的：无效 URL 应直接返回 invalid-url。
   */
  it("should_return_invalid_url_when_url_is_not_valid", async () => {
    const result = await downloadWallpaper({ kind: "unknown", url: "http://[::1" });
    expect(result).toEqual({ ok: false, reason: "invalid-url" });
  });
});

describe("getCurrentWallpaperSource", () => {
  /**
   * 目的：应优先读取标记过的背景媒体节点。
   */
  it("should_read_background_source_from_marked_media_node", () => {
    const img = document.createElement("img");
    img.setAttribute("data-background-media", "true");
    img.setAttribute("data-background-kind", "image");
    img.setAttribute("data-background-src", "https://example.com/actual.jpg");
    document.body.appendChild(img);

    expect(getCurrentWallpaperSource()).toEqual({ kind: "image", url: "https://example.com/actual.jpg" });
  });
});

