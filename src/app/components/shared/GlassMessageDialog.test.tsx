/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { GlassMessageDialog } from "./GlassMessageDialog";

describe("GlassMessageDialog", () => {
  /**
   * 目的：确认态点击主按钮应触发 onConfirm，替代系统 confirm 时可依赖该行为。
   * 前置：confirm 弹层挂载，挂载 spy。
   * 预期：点击「确定」回调执行一次。
   */
  it("should_call_onConfirm_when_confirm_primary_clicked", () => {
    const onConfirm = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <GlassMessageDialog
          open
          message="test"
          variant="confirm"
          onConfirm={onConfirm}
          onCancel={() => {}}
        />,
      );
    });

    act(() => {
      document.querySelectorAll("button").forEach((btn) => {
        if (btn.textContent?.includes("确定")) (btn as HTMLButtonElement).click();
      });
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
