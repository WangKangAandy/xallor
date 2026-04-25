/**
 * @vitest-environment jsdom
 */
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppI18nProvider } from "./i18n/AppI18n";
import { getWallpaperDownloadAlertMessage } from "./useDesktopBackgroundActions";
import { useDesktopBackgroundActions } from "./useDesktopBackgroundActions";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("getWallpaperDownloadAlertMessage", () => {
  /**
   * 目的：下载成功时应给出正向反馈，避免用户误判未触发下载动作。
   * 前置：`downloadWallpaper` 返回 `ok + download`。
   * 预期：文案为“壁纸已开始下载”。
   */
  it("should_return_success_message_when_download_mode_is_direct", () => {
    expect(getWallpaperDownloadAlertMessage({ ok: true, mode: "download" })).toBe("壁纸已开始下载");
  });

  /**
   * 目的：浏览器拦截弹窗时应给出明确引导，便于用户修复环境问题。
   * 前置：`downloadWallpaper` 返回 `popup-blocked`。
   * 预期：文案提示允许弹窗后重试。
   */
  it("should_return_popup_blocked_guidance_when_reason_is_popup_blocked", () => {
    expect(getWallpaperDownloadAlertMessage({ ok: false, reason: "popup-blocked" })).toBe(
      "自动下载失败，浏览器拦截了新窗口，请允许弹窗后重试",
    );
  });

  /**
   * 目的：未知失败原因应回退到兜底文案，保证交互反馈完整。
   * 前置：`downloadWallpaper` 返回 `fetch-failed`。
   * 预期：文案为统一失败提示。
   */
  it("should_return_fallback_message_when_reason_is_generic_failure", () => {
    expect(getWallpaperDownloadAlertMessage({ ok: false, reason: "fetch-failed" })).toBe("下载失败，请稍后重试");
  });
});

describe("useDesktopBackgroundActions", () => {
  let host: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
      root = null;
    }
    if (host) {
      host.remove();
      host = null;
    }
  });

  function mountBackgroundMenu(layoutMode: "default" | "minimal") {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    const onOpenAddSiteOrComponent = vi.fn();
    const onOpenWallpaperSettings = vi.fn();
    const onShowAlert = vi.fn();

    function Harness() {
      const { onDesktopBackgroundContextMenu, desktopBackgroundMenuPortal } = useDesktopBackgroundActions({
        layoutMode,
        onOpenAddSiteOrComponent,
        onOpenWallpaperSettings,
        onShowAlert,
      });
      return [
        createElement(
          "div",
          { key: "anchor", "data-testid": "menu-anchor", onContextMenu: onDesktopBackgroundContextMenu },
          "anchor",
        ),
        createElement("div", { key: "portal" }, desktopBackgroundMenuPortal),
      ];
    }

    act(() => {
      root?.render(createElement(AppI18nProvider, null, createElement(Harness)));
    });

    const anchor = host.querySelector('[data-testid="menu-anchor"]') as HTMLDivElement | null;
    if (!anchor) throw new Error("menu anchor not found");
    act(() => {
      anchor.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: 160,
          clientY: 160,
        }),
      );
    });
  }

  /**
   * 目的：极简模式背景菜单应由极简菜单模型接管，不能出现网格管理入口。
   * 前置：layoutMode=minimal，触发背景右键菜单。
   * 预期：不出现“添加站点 & 组件/整理模式”，保留壁纸管理入口。
   */
  it("should_hide_arrange_and_add_entries_in_minimal_layout_background_menu", () => {
    mountBackgroundMenu("minimal");
    expect(document.body.textContent).toContain("下载壁纸");
    expect(document.body.textContent).toContain("更换壁纸");
    expect(document.body.textContent).not.toContain("添加站点 & 组件");
    expect(document.body.textContent).not.toContain("整理模式");
  });
});
