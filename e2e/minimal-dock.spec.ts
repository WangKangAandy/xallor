import { expect, test } from "@playwright/test";

const DOCK_STORAGE_JSON = JSON.stringify({
  version: 1,
  entries: [
    {
      kind: "site",
      id: "e2e-dock-a",
      site: { name: "DockAlpha", domain: "alpha.e2e.test", url: "https://alpha.e2e.test/" },
    },
    {
      kind: "site",
      id: "e2e-dock-b",
      site: { name: "DockBeta", domain: "beta.e2e.test", url: "https://beta.e2e.test/" },
    },
  ],
});

async function openSettingsModal(page: Parameters<typeof test>[0]["page"]) {
  await page.getByTestId("sidebar-hover-zone").hover();
  const settingsBtn = page.locator('[data-testid="sidebar-hover-zone"] button').last();
  await expect(settingsBtn).toBeVisible({ timeout: 10_000 });
  await settingsBtn.click();
  await expect(page.getByTestId("settings-modal-close")).toBeVisible({ timeout: 10_000 });
}

async function openSettingsAppearance(page: Parameters<typeof test>[0]["page"]) {
  await openSettingsModal(page);
  await page.getByTestId("settings-nav-appearance").click();
  await expect(page.getByTestId("settings-minimal-dock-mode-pinned")).toBeVisible({ timeout: 10_000 });
}

async function gotoMinimalDockWithSites(page: Parameters<typeof test>[0]["page"]) {
  await page.goto("/");
  await page.evaluate(
    ([dockJson]) => {
      globalThis.localStorage.setItem("xallor_device_id", "e2e-minimal-dock");
      globalThis.localStorage.setItem("xallor_ui_layout", "minimal");
      globalThis.localStorage.setItem("xallor_ui_minimal_dock_mode", "pinned");
      globalThis.localStorage.setItem("xallor_minimal_dock_v1", dockJson);
    },
    [DOCK_STORAGE_JSON],
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
}

async function gotoMinimalDockPinnedEmpty(page: Parameters<typeof test>[0]["page"]) {
  await page.goto("/");
  await page.evaluate(() => {
    globalThis.localStorage.setItem("xallor_device_id", "e2e-minimal-dock-empty");
    globalThis.localStorage.setItem("xallor_ui_layout", "minimal");
    globalThis.localStorage.setItem("xallor_ui_minimal_dock_mode", "pinned");
    globalThis.localStorage.setItem("xallor_minimal_dock_v1", JSON.stringify({ version: 1, entries: [] }));
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
}

test.describe("minimal dock context menu and reorder", () => {
  test.describe.configure({ mode: "serial" });

  /**
   * 目的：极简 + Dock 常驻时，Dock 站点槽应弹出与网格一致的自定义右键菜单（含隐藏等项）。
   */
  /**
   * 目的：设置全屏层 z-[120] 打开且切到「外观」时，Dock 仍叠在遮罩之上可见（回归：Dock 勿包在 settings blur 容器内）。
   */
  test("should_show_minimal_dock_above_settings_when_appearance_section_open", async ({ page }) => {
    await gotoMinimalDockWithSites(page);
    await expect(page.getByTestId("minimal-dock-capsule")).toBeVisible({ timeout: 30_000 });
    await openSettingsAppearance(page);
    await expect(page.getByTestId("minimal-dock-capsule")).toBeVisible({ timeout: 10_000 });
  });

  /**
   * 目的：极简 + Dock 常驻时，Dock 站点槽应弹出与网格一致的自定义右键菜单（含隐藏等项）。
   */
  test("should_open_item_actions_menu_when_right_clicking_dock_site_slot", async ({ page }) => {
    await gotoMinimalDockWithSites(page);
    await expect(page.getByTestId("minimal-dock-capsule")).toBeVisible({ timeout: 30_000 });
    const firstSlot = page.getByTestId("minimal-dock-site-slot").first();
    await expect(firstSlot).toBeVisible();
    await firstSlot.click({ button: "right" });
    const menu = page.locator("[data-grid-context-menu]");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /隐藏|Hide/ })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /删除|Delete/ })).toBeVisible();
  });

  /**
   * 目的：Dock 内 react-dnd 排序后首槽 id 应变更为落点后的顺序（与 reorderMinimalDockEntries 行为一致）。
   */
  test("should_reorder_dock_sites_when_dragging_slot_to_another", async ({ page }) => {
    await gotoMinimalDockWithSites(page);
    await expect(page.getByTestId("minimal-dock-capsule")).toBeVisible({ timeout: 30_000 });
    const slots = page.getByTestId("minimal-dock-site-slot");
    await expect(slots).toHaveCount(2);
    await expect(slots.nth(0)).toHaveAttribute("data-dock-site-id", "e2e-dock-a");
    await slots.nth(0).dragTo(slots.nth(1));
    await expect(slots.nth(0)).toHaveAttribute("data-dock-site-id", "e2e-dock-b");
    await expect(slots.nth(1)).toHaveAttribute("data-dock-site-id", "e2e-dock-a");
    const raw = await page.evaluate(() => globalThis.localStorage.getItem("xallor_minimal_dock_v1"));
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw ?? "{}") as { entries: { id: string }[] };
    expect(parsed.entries.map((e) => e.id)).toEqual(["e2e-dock-b", "e2e-dock-a"]);
  });

  /**
   * 目的：Dock 存在站点时，「+」默认自动隐藏；仅悬停到加号区域时才显示。
   */
  test("should_auto_hide_add_tile_when_dock_has_sites_and_reveal_on_hover", async ({ page }) => {
    await gotoMinimalDockWithSites(page);
    const addTile = page.getByTestId("minimal-dock-add-outer");
    const addGlass = addTile.locator(":scope > div > div").first();
    await expect
      .poll(async () => Number.parseFloat((await addGlass.evaluate((el) => getComputedStyle(el).opacity)) || "1"))
      .toBeLessThan(0.1);
    await addTile.hover();
    await expect
      .poll(async () => Number.parseFloat((await addGlass.evaluate((el) => getComputedStyle(el).opacity)) || "0"))
      .toBeGreaterThan(0.9);
  });

  /**
   * 目的：极简 + Dock 常驻且空态时，加号入口应保持可见；打开设置外观后仍应可见，避免误判 Dock 未开启。
   */
  test("should_keep_add_tile_visible_when_pinned_mode_has_empty_dock", async ({ page }) => {
    await gotoMinimalDockPinnedEmpty(page);
    await expect(page.getByTestId("minimal-dock-add-outer")).toBeVisible({ timeout: 30_000 });
    await openSettingsAppearance(page);
    await expect(page.getByTestId("minimal-dock-add-outer")).toBeVisible({ timeout: 10_000 });
  });

  /**
   * 目的：auto-hide 模式下离开 Dock 后不应立刻收起，应至少保持 1s 再进入收起动画。
   */
  test("should_wait_about_one_second_before_hiding_after_pointer_leaves_dock", async ({ page }) => {
    await gotoMinimalDockWithSites(page);
    await page.evaluate(() => {
      globalThis.localStorage.setItem("xallor_ui_minimal_dock_mode", "auto_hide");
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);

    const shell = page.getByTestId("minimal-dock-hover-shell");
    const capsule = page.getByTestId("minimal-dock-capsule");
    const animatedShell = shell.locator(":scope > div").first();
    await expect(shell).toBeVisible({ timeout: 15_000 });

    await shell.hover();
    await expect(capsule).toBeVisible();

    // 离开 Dock 区域，触发 auto-hide 计时。
    await page.mouse.move(5, 5);

    // 1s 延迟前应保持可见（给一点裕量，900ms 仍可见）。
    await page.waitForTimeout(900);
    await expect(capsule).toBeVisible();

    // 超过 1s 延迟并给动画留时间后，shell 透明度应降到接近 0。
    await page.waitForTimeout(700);
    await expect
      .poll(async () => Number.parseFloat((await animatedShell.evaluate((el) => getComputedStyle(el).opacity)) || "1"))
      .toBeLessThan(0.1);
  });
});
