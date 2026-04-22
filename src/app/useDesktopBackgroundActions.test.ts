import { describe, expect, it } from "vitest";
import { getWallpaperDownloadAlertMessage } from "./useDesktopBackgroundActions";

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
