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

    await expect(bingOption).toHaveCount(0);
    await expect
      .poll(async () => page.evaluate(() => globalThis.localStorage?.getItem("xallor_ui_search_engine")))
      .toBe("bing");
    await expect(page.getByRole("textbox", { name: /^(搜索|Search)$/ })).toBeVisible();
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

  /**
   * 目的：桌面主槽内空白右键应弹出背景菜单（与主列 padding 场景互补）。
   */
  test("should open background context menu when right_clicking_blank_area_in_main_slot", async ({ page }) => {
    await page.goto("/");
    const mainSlot = page.getByTestId("desktop-main-slot");
    await expect(mainSlot).toBeVisible({ timeout: 10000 });

    const box = await mainSlot.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    await page.mouse.click(box.x + box.width - 12, box.y + box.height / 2, { button: "right" });

    await expect(page.getByRole("menu", { name: /图标操作|Item actions/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /下载壁纸|Download wallpaper/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /整理模式|Arrange/i })).toBeVisible();
  });

  /**
   * 目的：主列容器（含搜索与网格之间 margin 空白）右键也应走背景菜单，避免仅 slot 内可触发。
   * 前置：默认布局、搜索与 desktop-main-slot 均已挂载。
   * 预期：在搜索底边与主槽顶边之间的中点右击，出现与槽内空白一致的背景菜单。
   */
  test("should_open_background_context_menu_when_right_clicking_gap_between_search_and_grid", async ({ page }) => {
    await page.goto("/");
    const column = page.getByTestId("app-main-content-column");
    const searchRoot = page.locator("[data-search-bar-root]").first();
    const mainSlot = page.getByTestId("desktop-main-slot");
    await expect(column).toBeVisible({ timeout: 15000 });
    await expect(searchRoot).toBeVisible();
    await expect(mainSlot).toBeVisible();

    const colBox = await column.boundingBox();
    const searchBox = await searchRoot.boundingBox();
    const slotBox = await mainSlot.boundingBox();
    expect(colBox && searchBox && slotBox).toBeTruthy();
    if (!colBox || !searchBox || !slotBox) return;

    const gapMidY = (searchBox.y + searchBox.height + slotBox.y) / 2;
    const centerX = colBox.x + colBox.width / 2;
    await page.mouse.click(centerX, gapMidY, { button: "right" });

    await expect(page.getByRole("menu", { name: /图标操作|Item actions/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /下载壁纸|Download wallpaper/i })).toBeVisible();
  });

  /**
   * 目的：主列水平 padding 内（子内容宽度外）右击仍应命中主列上的背景菜单监听。
   * 前置：主列有 px-* padding，子列为全宽。
   * 预期：靠近主列右内边距处右击出现背景菜单。
   */
  test("should_open_background_context_menu_when_right_clicking_main_column_horizontal_padding", async ({
    page,
  }) => {
    await page.goto("/");
    const column = page.getByTestId("app-main-content-column");
    const mainSlot = page.getByTestId("desktop-main-slot");
    await expect(column).toBeVisible({ timeout: 15000 });
    await expect(mainSlot).toBeVisible();

    const colBox = await column.boundingBox();
    const slotBox = await mainSlot.boundingBox();
    expect(colBox && slotBox).toBeTruthy();
    if (!colBox || !slotBox) return;

    const x = colBox.x + colBox.width - 4;
    const y = slotBox.y + Math.min(slotBox.height * 0.5, 240);
    await page.mouse.click(x, y, { button: "right" });

    await expect(page.getByRole("menu", { name: /图标操作|Item actions/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /下载壁纸|Download wallpaper/i })).toBeVisible();
  });

  /**
   * 目的：下载壁纸只应出现在空白菜单，不应污染图标实体右键菜单。
   */
  test("should_not_show_download_wallpaper_in_searchbar_context_area", async ({ page }) => {
    await page.goto("/");
    const searchRoot = page.locator("[data-search-bar-root]").first();
    await expect(searchRoot).toBeVisible({ timeout: 10000 });
    await searchRoot.click({ button: "right" });
    await expect(page.getByRole("menuitem", { name: "下载壁纸" })).toHaveCount(0);
  });
});
