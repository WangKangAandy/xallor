import { expect, test } from "@playwright/test";

test.describe("searchbar layering and close behavior", () => {
  async function getSearchEngineTrigger(page: Parameters<typeof test>[0]["page"]) {
    await page.waitForSelector("[data-search-bar-root]", { timeout: 30000 });
    const root = page.locator("[data-search-bar-root]").first();
    await expect(root).toBeVisible();
    const trigger = root.locator('button[aria-label="选择搜索引擎"]').first();
    await expect(trigger).toBeVisible();
    return trigger;
  }

  /**
   * 目的：引擎下拉展开后应位于网格之上，可正常点击选项切换，不被卡片层遮挡。
   */
  test("should allow selecting engine option when dropdown is open", async ({ page }) => {
    await page.goto("/");

    const trigger = await getSearchEngineTrigger(page);
    await trigger.click();

    const bingOption = page.getByRole("button", { name: /Bing/ });
    await expect(bingOption).toBeVisible();
    await bingOption.click();

    await expect(page.getByPlaceholder("用 Bing 搜索…")).toBeVisible();
    await expect(bingOption).toHaveCount(0);
  });

  /**
   * 目的：引擎下拉展开后点击组件外区域，应自动收起（防止仅能靠触发按钮关闭）。
   */
  test("should close engine dropdown when clicking outside", async ({ page }) => {
    await page.goto("/");

    const trigger = await getSearchEngineTrigger(page);
    await trigger.click();

    const bingOption = page.getByRole("button", { name: /Bing/ });
    await expect(bingOption).toBeVisible();

    const outsideGridItem = page.locator("[data-grid-item-id]").first();
    await expect(outsideGridItem).toBeVisible();
    await outsideGridItem.click();

    await expect(bingOption).toHaveCount(0);
  });
});
