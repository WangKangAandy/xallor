import { expect, test } from "@playwright/test";

test.describe("arrange gesture", () => {
  async function getArrangeSelectedGridItemCount(page: Parameters<typeof test>[0]["page"]): Promise<number> {
    return page.evaluate(() => {
      const selectedShadowPattern = /59,\s*130,\s*246/;
      const roots = Array.from(document.querySelectorAll<HTMLElement>("[data-grid-item-id]"));
      return roots.filter((root) => {
        const descendants = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];
        return descendants.some((node) => {
          const inline = node.style.boxShadow ?? "";
          const computed = globalThis.getComputedStyle(node).boxShadow ?? "";
          return selectedShadowPattern.test(inline) || selectedShadowPattern.test(computed);
        });
      }).length;
    });
  }

  test("should enter arrange mode when dragging from blank area to hit grid items", async ({ page }) => {
    await page.goto("/");

    const dropzone = page.getByTestId("desktop-grid-dropzone");
    await expect(dropzone).toBeVisible();

    const box = await dropzone.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    // 从网格空白区起手，斜向拖动覆盖部分实体。
    const startX = box.x + 24;
    const startY = box.y + 24;
    const endX = box.x + Math.min(420, box.width - 24);
    const endY = box.y + Math.min(300, box.height - 24);

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 12 });
    await page.mouse.up();

    await expect(page.getByRole("button", { name: "退出整理模式" })).toBeVisible();
  });

  test("should dynamically add and remove selection while dragging", async ({ page }) => {
    await page.goto("/");

    const gridItems = page.locator("[data-grid-item-id]");
    await expect(gridItems.first()).toBeVisible();
    const itemCount = await gridItems.count();
    expect(itemCount).toBeGreaterThanOrEqual(2);

    const first = await gridItems.nth(0).boundingBox();
    const second = await gridItems.nth(1).boundingBox();
    const dropzone = await page.getByTestId("desktop-grid-dropzone").boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(dropzone).not.toBeNull();
    if (!first || !second || !dropzone) return;

    const startX = dropzone.x + 24;
    const startY = dropzone.y + 24;

    const coverFirstX = first.x + first.width * 0.8;
    const coverFirstY = first.y + first.height * 0.8;
    const coverBothX = Math.max(first.x + first.width, second.x + second.width) + 8;
    const coverBothY = Math.max(first.y + first.height, second.y + second.height) + 8;

    await page.mouse.move(startX, startY);
    await page.mouse.down();

    await page.mouse.move(coverFirstX, coverFirstY, { steps: 6 });
    await expect(page.getByRole("button", { name: "退出整理模式" })).toBeVisible();
    await expect.poll(async () => getArrangeSelectedGridItemCount(page)).toBeGreaterThanOrEqual(1);

    await page.mouse.move(coverBothX, coverBothY, { steps: 8 });
    await expect.poll(async () => getArrangeSelectedGridItemCount(page)).toBeGreaterThanOrEqual(2);

    await page.mouse.move(coverFirstX, coverFirstY, { steps: 8 });
    await expect.poll(async () => getArrangeSelectedGridItemCount(page)).toBe(1);

    await page.mouse.up();
  });
});
