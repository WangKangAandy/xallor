/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { describe, expect, it } from "vitest";
import { createRoot } from "react-dom/client";
import { AddIconDialog } from "./AddIconDialog";
import { AppI18nProvider } from "../../i18n/AppI18n";

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
        <AppI18nProvider>
          <AddIconDialog open onOpenChange={onOpenChange} contextSiteId="site-1" />
        </AppI18nProvider>,
      );
    });

    expect(document.querySelector('[data-ui-surface="add-icon"]')).not.toBeNull();
    const scrim = document.querySelector(
      '[data-ui-surface="add-icon"] > button[type="button"]',
    ) as HTMLButtonElement | null;
    expect(scrim?.getAttribute("style") ?? "").toContain("var(--surface-scrim-bg)");

    expect(document.body.textContent).toContain("添加图标");
    expect(document.body.textContent).toContain("GitHub");
    expect(document.body.textContent).toContain("预览");
    expect(document.body.textContent).toContain("添加");
    expect(document.body.textContent).toContain("继续添加");

    act(() => {
      root.render(
        <AppI18nProvider>
          <AddIconDialog open={false} onOpenChange={onOpenChange} contextSiteId={null} />
        </AppI18nProvider>,
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
        <AppI18nProvider>
          <AddIconDialog open onOpenChange={() => {}} contextSiteId="site-1" />
        </AppI18nProvider>,
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

  it.todo("should_insert_new_item_near_context_site_when_context_site_id_provided");

  /**
   * 目的：输入 URL 时自动生成站点候选并进入右侧预览，支持直接添加。
   * 前置：在左侧搜索框输入 URL-like 文本（例如 www.baidu.com）。
   * 预期：右侧出现该站点名称与网址，并且搜索框仅保留一个手动清除按钮。
   */
  it("should_generate_quick_site_preview_when_url_like_query_input", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <AppI18nProvider>
          <AddIconDialog open onOpenChange={() => {}} contextSiteId={null} />
        </AppI18nProvider>,
      );
    });

    const searchInput = document.querySelector('input[placeholder*="搜索站点或输入网址"]') as HTMLInputElement | null;
    expect(searchInput).not.toBeNull();
    expect(searchInput?.type).toBe("text");

    act(() => {
      if (searchInput) {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
        setter?.call(searchInput, "www.baidu.com");
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(document.body.textContent).toContain("Baidu");
    expect(document.body.textContent).toContain("www.baidu.com");
    expect(document.querySelectorAll('button[aria-label="清除搜索"]')).toHaveLength(1);

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
