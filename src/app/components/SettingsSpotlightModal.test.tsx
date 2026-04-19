/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { describe, expect, it } from "vitest";
import { createRoot } from "react-dom/client";
import { AppI18nProvider } from "../i18n/AppI18n";
import { SettingsSpotlightModal } from "./SettingsSpotlightModal";

describe("SettingsSpotlightModal", () => {
  /**
   * 目的：侧栏「外观」可切换主区；避免导航仅为装饰、外观页无法验收。
   * 前置：设置弹层打开，默认在「通用」。
   * 预期：点击 `settings-nav-appearance` 后出现主题分段与壁纸预览相关文案。
   */
  it("should_show_appearance_sections_when_appearance_nav_clicked", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <AppI18nProvider>
          <SettingsSpotlightModal
            open
            onClose={() => {}}
            layoutMode="default"
            onLayoutModeChange={() => {}}
            openLinksInNewTab={false}
            onOpenLinksInNewTabChange={() => {}}
          />
        </AppI18nProvider>,
      );
    });

    expect(document.body.textContent).toContain("语言");

    act(() => {
      document.querySelector<HTMLButtonElement>('[data-testid="settings-nav-appearance"]')?.click();
    });

    expect(document.body.textContent).toContain("主题");
    expect(document.body.textContent).toContain("壁纸");
    expect(document.querySelector('[data-testid="settings-appearance-theme-system"]')).toBeTruthy();

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
