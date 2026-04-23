/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { describe, expect, it } from "vitest";
import { createRoot } from "react-dom/client";
import { AppI18nProvider } from "../i18n/AppI18n";
import { UserLocalAssetsProvider } from "../localUpload";
import { UiPreferencesProvider } from "../preferences";
import { SettingsSpotlightModal } from "./SettingsSpotlightModal";

describe("SettingsSpotlightModal", () => {
  function getBaseProps() {
    return {
      open: true,
      onClose: () => {},
      layoutMode: "default" as const,
      onLayoutModeChange: () => {},
      openLinksInNewTab: false,
      onOpenLinksInNewTabChange: () => {},
      hiddenSpaceEnabled: false,
      hiddenItems: [],
      onEnableHiddenSpace: async () => {},
      onDisableHiddenSpace: async () => true,
      onVerifyHiddenPassword: async () => true,
      onRemoveHiddenItems: () => {},
      onRestoreHiddenItems: () => {},
      onAddItemFromSettings: () => {},
      isMinimalMode: false,
    };
  }
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
          <UiPreferencesProvider>
            <UserLocalAssetsProvider>
            <SettingsSpotlightModal
              {...getBaseProps()}
            />
            </UserLocalAssetsProvider>
          </UiPreferencesProvider>
        </AppI18nProvider>,
      );
    });

    expect(document.body.textContent).toContain("语言");
    expect(document.body.textContent).not.toContain("布局设置");

    act(() => {
      document.querySelector<HTMLButtonElement>('[data-testid="settings-nav-appearance"]')?.click();
    });

    expect(document.body.textContent).toContain("主题");
    expect(document.body.textContent).toContain("壁纸");
    expect(document.body.textContent).toContain("布局设置");
    expect(document.querySelector('[data-testid="settings-appearance-theme-system"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="settings-layout-mode-default"]')).toBeTruthy();

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  /**
   * 目的：壁纸分区从 Coming Soon 升级为独立面板，便于产品与云端接入前验收版式。
   * 前置：设置弹层打开。
   * 预期：点击 `settings-nav-wallpaper` 后出现图库筛选、缩略图网格与右侧预览/应用入口。
   */
  it("should_show_wallpaper_panel_when_wallpaper_nav_clicked", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <AppI18nProvider>
          <UiPreferencesProvider>
            <UserLocalAssetsProvider>
              <SettingsSpotlightModal
                {...getBaseProps()}
              />
            </UserLocalAssetsProvider>
          </UiPreferencesProvider>
        </AppI18nProvider>,
      );
    });

    act(() => {
      document.querySelector<HTMLButtonElement>('[data-testid="settings-nav-wallpaper"]')?.click();
    });

    expect(document.querySelector('[data-testid="settings-wallpaper-panel"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="settings-wallpaper-filter-all"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="settings-wallpaper-tile-w1"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="settings-wallpaper-apply"]')).toBeTruthy();

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  /**
   * 目的：账户分区已从占位态升级为可视化面板，避免侧栏点击后仍显示 coming soon。
   * 前置：设置弹层打开，默认分区为「通用」。
   * 预期：点击 `settings-nav-account` 后渲染账户信息卡片。
   */
  it("should_show_account_panel_when_account_nav_clicked", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <AppI18nProvider>
          <UiPreferencesProvider>
            <UserLocalAssetsProvider>
            <SettingsSpotlightModal
              {...getBaseProps()}
            />
            </UserLocalAssetsProvider>
          </UiPreferencesProvider>
        </AppI18nProvider>,
      );
    });

    act(() => {
      document.querySelector<HTMLButtonElement>('[data-testid="settings-nav-account"]')?.click();
    });

    expect(document.querySelector('[data-testid="settings-account-panel"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="settings-account-basic-info"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="settings-account-sync-backup"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="settings-account-security"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="settings-account-preferences-data"]')).toBeTruthy();

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  /**
   * 目的：通用页可切换默认搜索引擎，确保设置入口能驱动全局偏好。
   * 前置：设置弹层打开在「通用」。
   * 预期：点击触发器展开小框并选择 Google 后，触发器文案更新为 Google。
   */
  it("should_update_default_search_engine_label_when_engine_option_selected_in_general_section", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <AppI18nProvider>
          <UiPreferencesProvider>
            <UserLocalAssetsProvider>
            <SettingsSpotlightModal
              {...getBaseProps()}
            />
            </UserLocalAssetsProvider>
          </UiPreferencesProvider>
        </AppI18nProvider>,
      );
    });

    const trigger = document.querySelector(
      '[data-testid="settings-default-search-engine-trigger"]',
    ) as HTMLButtonElement | null;
    expect(trigger).not.toBeNull();
    expect(trigger?.textContent).toContain("百度");

    act(() => {
      trigger?.click();
    });

    const option = document.querySelector(
      '[data-testid="settings-default-search-engine-option-google"]',
    ) as HTMLButtonElement | null;
    expect(option).not.toBeNull();

    act(() => {
      option?.click();
    });

    expect(trigger?.textContent).toContain("Google");

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  /**
   * 目的：搜索引擎下拉展开后，点击外部区域应关闭，避免悬浮层残留。
   * 前置：通用页展开默认搜索引擎下拉。
   * 预期：触发外部 pointerdown 后，下拉 listbox 被移除。
   */
  it("should_close_search_engine_picker_when_pointerdown_outside", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <AppI18nProvider>
          <UiPreferencesProvider>
            <UserLocalAssetsProvider>
            <SettingsSpotlightModal
              {...getBaseProps()}
            />
            </UserLocalAssetsProvider>
          </UiPreferencesProvider>
        </AppI18nProvider>,
      );
    });

    const trigger = document.querySelector(
      '[data-testid="settings-default-search-engine-trigger"]',
    ) as HTMLButtonElement | null;
    expect(trigger).not.toBeNull();

    act(() => {
      trigger?.click();
    });

    expect(document.querySelector('[role="listbox"]')).toBeTruthy();

    act(() => {
      document.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });

    expect(document.querySelector('[role="listbox"]')).toBeNull();

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  /**
   * 目的：点击右上角关闭按钮应触发关闭回调，防止关闭入口回归失效。
   * 前置：弹层打开，`onClose` 回调可被观测。
   * 预期：点击 `settings-modal-close` 后触发 `onClose` 一次。
   */
  it("should_trigger_on_close_when_header_close_button_clicked", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    let closeCount = 0;

    act(() => {
      root.render(
        <AppI18nProvider>
          <UiPreferencesProvider>
            <UserLocalAssetsProvider>
            <SettingsSpotlightModal
              {...getBaseProps()}
              onClose={() => {
                closeCount += 1;
              }}
            />
            </UserLocalAssetsProvider>
          </UiPreferencesProvider>
        </AppI18nProvider>,
      );
    });

    const closeButton = document.querySelector('[data-testid="settings-modal-close"]') as HTMLButtonElement | null;
    expect(closeButton).not.toBeNull();

    act(() => {
      closeButton?.click();
    });

    expect(closeCount).toBe(1);

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

});
