/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { useAppMessageState } from "./useAppMessageState";

type MessageStateSnapshot = ReturnType<typeof useAppMessageState>;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function mountMessageStateHarness() {
  let latest: MessageStateSnapshot | null = null;

  function Harness() {
    const state = useAppMessageState();
    useEffect(() => {
      latest = state;
    }, [state]);
    return null;
  }

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<Harness />);
  });

  const getLatest = () => {
    if (!latest) throw new Error("message state not ready");
    return latest;
  };

  const cleanup = () => {
    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  };

  return { getLatest, cleanup };
}

describe("useAppMessageState", () => {
  /**
   * 目的：普通提示通道应可直接设置 alert 消息，供背景下载等逻辑复用。
   * 前置：调用 showAlert("x")。
   * 预期：appMessage 为 alert 且文案保持一致。
   */
  it("should_set_alert_variant_when_show_alert_called", () => {
    const harness = mountMessageStateHarness();
    act(() => {
      harness.getLatest().showAlert("x");
    });
    expect(harness.getLatest().appMessage).toEqual({ variant: "alert", message: "x" });
    harness.cleanup();
  });

  /**
   * 目的：引导去设置的提示应进入 alert-go-settings 分支，便于 UI 分发专用按钮。
   * 前置：调用 showGoToSettingsAlert。
   * 预期：appMessage.variant 为 alert-go-settings。
   */
  it("should_set_go_settings_variant_when_show_go_settings_alert_called", () => {
    const harness = mountMessageStateHarness();
    act(() => {
      harness.getLatest().showGoToSettingsAlert("go");
    });
    expect(harness.getLatest().appMessage).toEqual({ variant: "alert-go-settings", message: "go" });
    harness.cleanup();
  });

  /**
   * 目的：文件夹隐藏确认应可返回 Promise 并在用户选择后 resolve。
   * 前置：发起 requestFolderHideConfirm 后调用 resolveFolderHideConfirm(false)。
   * 预期：Promise resolve 为 false 且消息状态清空。
   */
  it("should_resolve_pending_folder_confirm_when_resolve_called", async () => {
    const harness = mountMessageStateHarness();
    let confirmed = true;
    const pending = harness.getLatest().requestFolderHideConfirm();
    await act(async () => {
      await Promise.resolve();
    });
    expect(harness.getLatest().appMessage?.variant).toBe("confirm-folder");
    act(() => {
      harness.getLatest().resolveFolderHideConfirm(false);
    });
    confirmed = await pending;
    expect(confirmed).toBe(false);
    expect(harness.getLatest().appMessage).toBeNull();
    harness.cleanup();
  });
});
