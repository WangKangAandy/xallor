/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { EditableLabel } from "./DesktopGridItemPrimitives";

describe("EditableLabel outside cancel behavior", () => {
  /**
   * 目的：保护“编辑名称时点击外部应撤销编辑（不保存）”交互，避免被全局 pointerdown 协议回归影响。
   * 前置：进入编辑态并输入新名称，然后在组件外触发 pointerdown。
   * 预期：编辑态关闭，原名称保持不变，onRename 不被调用。
   */
  it("should_cancel_edit_without_rename_when_pointerdown_outside_during_editing", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onRename = vi.fn();

    act(() => {
      root.render(<EditableLabel initialName="旧名称" onRename={onRename} />);
    });

    const label = container.querySelector("span");
    expect(label?.textContent).toContain("旧名称");

    act(() => {
      label?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const input = container.querySelector("input") as HTMLInputElement | null;
    expect(input).not.toBeNull();
    act(() => {
      input!.value = "新名称";
      input!.dispatchEvent(new Event("input", { bubbles: true }));
    });

    act(() => {
      document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    });

    expect(container.querySelector("input")).toBeNull();
    expect(container.textContent).toContain("旧名称");
    expect(onRename).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
