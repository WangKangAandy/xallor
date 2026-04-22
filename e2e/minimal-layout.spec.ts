import { expect, test } from "@playwright/test";

test.describe("minimal layout mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      globalThis.localStorage.clear();
      globalThis.localStorage.setItem("xallor_device_id", "e2e-seed-device");
    });
  });

  async function openSettings(page: Parameters<typeof test>[0]["page"]) {
    await page.getByTestId("sidebar-hover-zone").hover();
    const settingsBtn = page.locator('[data-testid="sidebar-hover-zone"] button').last();
    await expect(settingsBtn).toBeVisible({ timeout: 10_000 });
    await settingsBtn.click();
    await expect(page.getByTestId("settings-layout-mode-default")).toBeVisible({ timeout: 10_000 });
  }

  /**
   * 目的：首屏从 localStorage 读入 minimal 时不挂载桌面。
   */
  test("should_not_mount_desktop_when_storage_is_minimal_on_load", async ({ page }) => {
    await page.addInitScript(() => {
      globalThis.localStorage.setItem("xallor_ui_layout", "minimal");
    });
    await page.goto("/");
    await expect(page.getByTestId("desktop-main-slot")).toHaveCount(0);
  });

  /**
   * 目的：极简态下从设置切回「网格」后恢复桌面；控件 aria-pressed 反映当前 layoutMode（枚举仍为 default）。
   * 使用与上例相同的 init 写入 minimal，避免首屏后再改 storage 与首帧竞态。
   */
  test("should_restore_desktop_when_switching_to_default_from_minimal_in_settings", async ({ page }) => {
    await page.addInitScript(() => {
      globalThis.localStorage.setItem("xallor_ui_layout", "minimal");
    });
    await page.goto("/");
    await expect(page.getByTestId("desktop-main-slot")).toHaveCount(0);

    await openSettings(page);
    await expect(page.getByTestId("settings-layout-mode-minimal")).toHaveAttribute("aria-pressed", "true");

    await page.getByTestId("settings-layout-mode-default").click();
    await expect(page.getByTestId("settings-layout-mode-default")).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("settings-modal-close").click();

    await expect(page.getByTestId("desktop-main-slot")).toBeVisible({ timeout: 30_000 });
  });
});
