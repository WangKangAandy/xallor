/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { describe, expect, it } from "vitest";
import { createRoot } from "react-dom/client";
import { AddIconDialog } from "./AddIconDialog";

describe("AddIconDialog", () => {
  /**
   * 目的：弹层打开时渲染左右分栏壳与底栏按钮；关闭时不残留节点。
   */
  it("should_mount_dialog_shell_in_body_when_open_and_remove_when_closed", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onOpenChange = () => {};

    act(() => {
      root.render(
        <AddIconDialog open onOpenChange={onOpenChange} contextSiteId="site-1" />,
      );
    });

    expect(document.body.textContent).toContain("添加图标");
    expect(document.body.textContent).toContain("GitHub");
    expect(document.body.textContent).toContain("预览");
    expect(document.body.textContent).toContain("保存并退出");
    expect(document.body.textContent).toContain("site-1");

    act(() => {
      root.render(
        <AddIconDialog open={false} onOpenChange={onOpenChange} contextSiteId={null} />,
      );
    });

    expect(document.querySelector('[role="dialog"]')).toBeNull();

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
