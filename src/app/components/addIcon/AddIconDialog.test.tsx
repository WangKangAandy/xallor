/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { describe, expect, it } from "vitest";
import { createRoot } from "react-dom/client";
import { AddIconDialog } from "./AddIconDialog";

describe("AddIconDialog", () => {
  /**
   * 目的：弹层打开时渲染左右分栏与预览区内三键；关闭时不残留节点。
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
    expect(document.body.textContent).toContain("取消");
    expect(document.body.textContent).toContain("添加");
    expect(document.body.textContent).toContain("继续添加");

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

  /**
   * 目的：站点预览「图标」一行可切换选中态；避免仅首项静态蓝框、点击无反馈。
   * 前置：弹层打开后在左栏「站点」分区选中第一项（内置目录为 GitHub）。
   * 预期：点击「反色」后仅该项 aria-checked 为 true。
   */
  it("should_update_icon_row_selection_when_another_variant_clicked", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <AddIconDialog open onOpenChange={() => {}} contextSiteId="site-1" />,
      );
    });

    const siteSection = document.querySelector('section[aria-label="站点"]');
    const firstSiteTile = siteSection?.querySelector(
      '[role="option"]',
    ) as HTMLButtonElement | null;
    act(() => {
      firstSiteTile?.click();
    });

    const colorBtn = document.querySelector(
      '[aria-label="图标：彩色"]',
    ) as HTMLButtonElement | null;
    const invertBtn = document.querySelector(
      '[aria-label="图标：反色"]',
    ) as HTMLButtonElement | null;

    expect(colorBtn?.getAttribute("aria-checked")).toBe("true");
    expect(invertBtn?.getAttribute("aria-checked")).toBe("false");

    act(() => {
      invertBtn?.click();
    });

    expect(colorBtn?.getAttribute("aria-checked")).toBe("false");
    expect(invertBtn?.getAttribute("aria-checked")).toBe("true");

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
