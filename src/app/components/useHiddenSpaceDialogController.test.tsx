/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { useEffect } from "react";
import { useHiddenSpaceDialogController } from "./useHiddenSpaceDialogController";

type ControllerSnapshot = ReturnType<typeof useHiddenSpaceDialogController>;

function mountController(params?: {
  verifyOk?: boolean;
  disableOk?: boolean;
}) {
  const verifyOk = params?.verifyOk ?? true;
  const disableOk = params?.disableOk ?? true;
  let latest: ControllerSnapshot | null = null;
  let verifiedOpenPanelCount = 0;
  let disableConfirmedCount = 0;
  const onEnableHiddenSpace = vi.fn(async () => {});
  const onDisableHiddenSpace = vi.fn(async () => disableOk);
  const onVerifyHiddenPassword = vi.fn(async () => verifyOk);

  function Harness() {
    const controller = useHiddenSpaceDialogController({
      onEnableHiddenSpace,
      onDisableHiddenSpace,
      onVerifyHiddenPassword,
      onVerifiedOpenPanel: () => {
        verifiedOpenPanelCount += 1;
      },
      onDisableConfirmed: () => {
        disableConfirmedCount += 1;
      },
    });
    useEffect(() => {
      latest = controller;
    }, [controller]);
    return null;
  }

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<Harness />);
  });

  const getLatest = () => {
    if (!latest) throw new Error("controller not ready");
    return latest;
  };
  const cleanup = () => {
    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  };

  return {
    getLatest,
    cleanup,
    getVerifiedOpenPanelCount: () => verifiedOpenPanelCount,
    getDisableConfirmedCount: () => disableConfirmedCount,
    onEnableHiddenSpace,
    onDisableHiddenSpace,
    onVerifyHiddenPassword,
  };
}

describe("useHiddenSpaceDialogController", () => {
  /**
   * 目的：开启隐私空间时密码过短应拦截提交并给出错误文案。
   * 前置：进入 `enable` 对话态，输入不足 4 位密码。
   * 预期：保持在当前流程且 `passwordError` 为长度提示。
   */
  it("should_set_length_error_when_enable_password_too_short", async () => {
    const harness = mountController();
    const api1 = harness.getLatest();
    act(() => {
      api1.requestToggleHiddenSpace(false);
    });
    const api2 = harness.getLatest();
    act(() => {
      api2.setPasswordDraft("123");
      api2.setPasswordConfirmDraft("123");
    });
    await act(async () => {
      await harness.getLatest().submitEnable();
    });
    expect(harness.getLatest().passwordError).toBe("密码长度至少 4 位");
    harness.cleanup();
  });

  /**
   * 目的：验证打开隐私面板流程在密码正确时应切换到 panel。
   * 前置：进入 `verify-open` 状态并提交正确密码。
   * 预期：`dialog` 变为 `panel` 且触发 `onVerifiedOpenPanel`。
   */
  it("should_enter_panel_when_verify_open_succeeds", async () => {
    const harness = mountController({ verifyOk: true });
    act(() => {
      harness.getLatest().requestOpenHiddenPanel();
    });
    act(() => {
      harness.getLatest().setVerifyPasswordDraft("pass");
    });
    await act(async () => {
      await harness.getLatest().submitVerify();
    });
    expect(harness.getLatest().dialog).toBe("panel");
    expect(harness.getVerifiedOpenPanelCount()).toBe(1);
    harness.cleanup();
  });

  /**
   * 目的：关闭隐私空间确认流程成功后应回到 none 并触发已确认回调。
   * 前置：先走 `verify-disable` -> `confirm-disable`，再执行确认关闭。
   * 预期：`dialog` 归位 `none` 且 `onDisableConfirmed` 被调用一次。
   */
  it("should_reset_dialog_when_confirm_disable_succeeds", async () => {
    const harness = mountController({ verifyOk: true, disableOk: true });
    act(() => {
      harness.getLatest().requestToggleHiddenSpace(true);
    });
    act(() => {
      harness.getLatest().setVerifyPasswordDraft("pass");
    });
    await act(async () => {
      await harness.getLatest().submitVerify();
    });
    expect(harness.getLatest().dialog).toBe("confirm-disable");
    await act(async () => {
      await harness.getLatest().submitConfirmDisable();
    });
    expect(harness.getLatest().dialog).toBe("none");
    expect(harness.getDisableConfirmedCount()).toBe(1);
    harness.cleanup();
  });
});
