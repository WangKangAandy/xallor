/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { useSettingsModalController } from "./useSettingsModalController";

type ControllerSnapshot = ReturnType<typeof useSettingsModalController>;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function mountSettingsModalControllerHarness() {
  let latest: ControllerSnapshot | null = null;

  function Harness() {
    const state = useSettingsModalController();
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
    if (!latest) throw new Error("settings modal controller not ready");
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

describe("useSettingsModalController", () => {
  /**
   * 目的：默认打开设置时应清空初始分区，避免继承上一次上下文。
   * 前置：先以 widgets 打开，再调用默认打开。
   * 预期：`settingsInitialSection` 为 undefined 且保持打开态。
   */
  it("should_reset_initial_section_when_opening_default_settings", () => {
    const harness = mountSettingsModalControllerHarness();
    act(() => {
      harness.getLatest().openSettingsWidgets();
    });
    act(() => {
      harness.getLatest().openSettingsDefault();
    });
    expect(harness.getLatest().isSettingsOpen).toBe(true);
    expect(harness.getLatest().settingsInitialSection).toBeUndefined();
    harness.cleanup();
  });

  /**
   * 目的：隐私引导入口应把分区定位到 privacy，保证提示跳转一致。
   * 前置：调用 openSettingsPrivacy。
   * 预期：打开状态为 true，初始分区为 privacy。
   */
  it("should_open_privacy_section_when_open_settings_privacy_called", () => {
    const harness = mountSettingsModalControllerHarness();
    act(() => {
      harness.getLatest().openSettingsPrivacy();
    });
    expect(harness.getLatest().isSettingsOpen).toBe(true);
    expect(harness.getLatest().settingsInitialSection).toBe("privacy");
    harness.cleanup();
  });

  /**
   * 目的：关闭设置只影响可见性，不应改写初始分区指令。
   * 前置：先以 widgets 打开再关闭。
   * 预期：`isSettingsOpen=false` 且 `settingsInitialSection` 仍为 widgets。
   */
  it("should_keep_last_section_hint_when_close_settings_called", () => {
    const harness = mountSettingsModalControllerHarness();
    act(() => {
      harness.getLatest().openSettingsWidgets();
    });
    act(() => {
      harness.getLatest().closeSettings();
    });
    expect(harness.getLatest().isSettingsOpen).toBe(false);
    expect(harness.getLatest().settingsInitialSection).toBe("widgets");
    harness.cleanup();
  });
});
