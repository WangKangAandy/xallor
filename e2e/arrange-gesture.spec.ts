import { expect, test } from "@playwright/test";

test.describe("arrange gesture", () => {
  async function installDeterministicGridFixture(page: Parameters<typeof test>[0]["page"]): Promise<void> {
    await page.addInitScript(() => {
      // 仅清理持久化，回退到应用内置默认数据，避免测试间状态污染。
      globalThis.localStorage.clear();
      globalThis.localStorage.setItem("xallor_device_id", "e2e-seed-device");
    });
  }

  test.beforeEach(async ({ page }) => {
    await installDeterministicGridFixture(page);
  });

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

  async function getArrangeHitOscillationCount(page: Parameters<typeof test>[0]["page"]): Promise<number> {
    return page.evaluate(() => {
      const win = window as typeof window & {
        __arrangeGestureDebugApi?: { dump: () => Array<{ phase?: string; ts?: number; hitCount?: number }> };
      };
      const events = win.__arrangeGestureDebugApi?.dump?.() ?? [];
      const moveHits = events.filter((event) => event.phase === "move-hit");
      let oscillation = 0;
      for (let i = 1; i < moveHits.length; i += 1) {
        const prev = moveHits[i - 1];
        const next = moveHits[i];
        if (prev?.ts !== next?.ts) continue;
        const prevHit = prev?.hitCount ?? -1;
        const nextHit = next?.hitCount ?? -1;
        if ((prevHit === 0 && nextHit > 0) || (nextHit === 0 && prevHit > 0)) {
          oscillation += 1;
        }
      }
      return oscillation;
    });
  }

  async function enterArrangeModeByDraggingToFirstItem(page: Parameters<typeof test>[0]["page"]): Promise<void> {
    const dropzone = page.getByTestId("desktop-grid-dropzone");
    const gridItems = page.locator("[data-grid-item-id]");
    await expect(dropzone).toBeVisible();
    await expect(gridItems.first()).toBeVisible();

    const box = await dropzone.boundingBox();
    const first = await gridItems.nth(0).boundingBox();
    expect(box).not.toBeNull();
    expect(first).not.toBeNull();
    if (!box || !first) return;

    await page.mouse.move(box.x + 24, box.y + 24);
    await page.mouse.down();
    await page.mouse.move(first.x + first.width * 0.8, first.y + first.height * 0.8, { steps: 8 });
    await page.mouse.up();
    await expect(page.getByRole("button", { name: "退出整理模式" })).toBeVisible();
  }

  async function waitForGridReady(page: Parameters<typeof test>[0]["page"]): Promise<void> {
    await page.waitForSelector('[data-testid="desktop-grid-dropzone"]', { timeout: 30000 });
    await page.waitForSelector("[data-grid-item-id]", { timeout: 30000 });
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
    await page.evaluate(() => {
      const win = window as typeof window & {
        __arrangeGestureDebugApi?: { enable: (verbose?: boolean) => void; clear: () => void; disable: () => void };
      };
      win.__arrangeGestureDebugApi?.enable(false);
      win.__arrangeGestureDebugApi?.clear();
    });

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
    await expect.poll(async () => getArrangeHitOscillationCount(page)).toBe(0);
    await page.evaluate(() => {
      const win = window as typeof window & { __arrangeGestureDebugApi?: { disable: () => void } };
      win.__arrangeGestureDebugApi?.disable();
    });
  });

  test("should not enter arrange mode when drag distance is below activation threshold", async ({ page }) => {
    await page.goto("/");

    const dropzone = page.getByTestId("desktop-grid-dropzone");
    await expect(dropzone).toBeVisible();
    const box = await dropzone.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    // 小于激活阈值（6px）时，不应进入整理模式。
    const startX = box.x + 24;
    const startY = box.y + 24;
    const endX = startX + 3;
    const endY = startY + 3;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 5 });
    await page.mouse.up();

    await expect(page.getByRole("button", { name: "退出整理模式" })).toHaveCount(0);
  });

  test("should delete_selected_items_when_delete_pressed_in_arrange_mode", async ({ page }) => {
    await page.goto("/");

    const gridItems = page.locator("[data-grid-item-id]");
    await expect(gridItems.first()).toBeVisible();
    const beforeCount = await gridItems.count();
    expect(beforeCount).toBeGreaterThanOrEqual(1);

    await enterArrangeModeByDraggingToFirstItem(page);
    await expect.poll(async () => getArrangeSelectedGridItemCount(page)).toBeGreaterThanOrEqual(1);

    await page.keyboard.press("Delete");

    await expect.poll(async () => page.locator("[data-grid-item-id]").count()).toBeLessThan(beforeCount);
    await expect.poll(async () => getArrangeSelectedGridItemCount(page)).toBe(0);
  });

  /**
   * 目的：已选中多个顶层图标时，拖拽其中一个应按选择集批量移动，而非只移动单项。
   */
  test("should_move_selected_group_when_dragging_one_selected_item", async ({ page }) => {
    await page.goto("/");
    await waitForGridReady(page);

    const allItems = page.locator("[data-grid-item-id]");
    await expect(allItems.first()).toBeVisible();

    const candidateSiteIds = await allItems.evaluateAll((nodes) =>
      nodes
        .map((node) => node.getAttribute("data-grid-item-id") ?? "")
        .filter((id) => id.length > 0 && !/^f\d+$/i.test(id) && !id.startsWith("folder-")),
    );
    expect(candidateSiteIds.length).toBeGreaterThanOrEqual(4);
    const [firstId, secondId, thirdId, fourthId] = candidateSiteIds;
    const beforeOrder = await allItems.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-grid-item-id") ?? ""));
    const beforeIndexA = beforeOrder.indexOf(firstId);
    const beforeIndexB = beforeOrder.indexOf(secondId);

    await enterArrangeModeByDraggingToFirstItem(page);
    await expect.poll(async () => getArrangeSelectedGridItemCount(page)).toBe(1);

    const firstCard = page.locator(`[data-grid-item-id="${firstId}"]`);
    const secondCard = page.locator(`[data-grid-item-id="${secondId}"]`);
    const thirdCard = page.locator(`[data-grid-item-id="${thirdId}"]`);
    const fourthCard = page.locator(`[data-grid-item-id="${fourthId}"]`);
    await expect(firstCard).toBeVisible();
    await expect(secondCard).toBeVisible();
    await expect(thirdCard).toBeVisible();
    await expect(fourthCard).toBeVisible();
    await secondCard.click();
    await expect.poll(async () => getArrangeSelectedGridItemCount(page)).toBeGreaterThanOrEqual(2);

    const dragSource = firstCard;
    const dropTarget = fourthCard;
    await expect(dragSource).toBeVisible();
    await expect(dropTarget).toBeVisible();

    // 落在边缘区触发重排路径，避免中心区合并逻辑干扰断言。
    await dragSource.dragTo(dropTarget, { targetPosition: { x: 4, y: 4 } });

    await expect.poll(async () => {
      const ids = await page
        .locator("[data-grid-item-id]")
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-grid-item-id") ?? ""));
      const indexA = ids.indexOf(firstId);
      const indexB = ids.indexOf(secondId);
      const indexC = ids.indexOf(thirdId);
      return {
        ids,
        indexA,
        indexB,
        indexC,
      };
    }).toMatchObject({
      indexB: expect.any(Number),
    });

    const afterIds = await page
      .locator("[data-grid-item-id]")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-grid-item-id") ?? ""));
    const indexA = afterIds.indexOf(firstId);
    const indexB = afterIds.indexOf(secondId);
    const indexC = afterIds.indexOf(thirdId);
    expect(indexA).toBeGreaterThan(-1);
    expect(indexB).toBeGreaterThan(-1);
    expect(indexC).toBeGreaterThan(-1);
    // 批量移动应保持选中组相邻，且至少两项都发生了位置变化。
    expect(indexB).toBe(indexA + 1);
    expect(indexA).not.toBe(beforeIndexA);
    expect(indexB).not.toBe(beforeIndexB);
  });

  /**
   * 目的：整理模式下已选中多个顶层站点时，拖到文件夹中心区应批量并入目标文件夹。
   */
  test("should_merge_selected_group_into_folder_when_drop_in_center_zone", async ({ page }) => {
    await page.goto("/");
    await waitForGridReady(page);

    const allItems = page.locator("[data-grid-item-id]");
    await expect(allItems.first()).toBeVisible();

    const candidateSiteIds = await allItems.evaluateAll((nodes) =>
      nodes
        .map((node) => node.getAttribute("data-grid-item-id") ?? "")
        .filter((id) => id.length > 0 && !/^f\d+$/i.test(id) && !id.startsWith("folder-")),
    );
    expect(candidateSiteIds.length).toBeGreaterThanOrEqual(2);
    const [firstId, secondId] = candidateSiteIds;

    await enterArrangeModeByDraggingToFirstItem(page);
    await expect.poll(async () => getArrangeSelectedGridItemCount(page)).toBe(1);

    const firstCard = page.locator(`[data-grid-item-id="${firstId}"]`);
    const secondCard = page.locator(`[data-grid-item-id="${secondId}"]`);
    const folderCard = page.locator('[data-grid-item-id="f1"]');
    await expect(firstCard).toBeVisible();
    await expect(secondCard).toBeVisible();
    await expect(folderCard).toBeVisible();

    await secondCard.click();
    await expect.poll(async () => getArrangeSelectedGridItemCount(page)).toBeGreaterThanOrEqual(2);

    const beforeCount = await allItems.count();
    const folderBox = await folderCard.boundingBox();
    expect(folderBox).not.toBeNull();
    if (!folderBox) return;

    await firstCard.dragTo(folderCard, {
      targetPosition: { x: folderBox.width / 2, y: folderBox.height / 2 },
    });

    // 两个站点并入后，顶层项目数应减少（至少减少 1；通常为 -2，但可能伴随规范化影响）。
    await expect.poll(async () => page.locator("[data-grid-item-id]").count()).toBeLessThan(beforeCount);
    await expect(page.locator(`[data-grid-item-id="${firstId}"]`)).toHaveCount(0);
    await expect(page.locator(`[data-grid-item-id="${secondId}"]`)).toHaveCount(0);
    await expect(folderCard).toBeVisible();
  });

  /**
   * 目的：固化「外层选中文件夹 → ⤢ 展开内部整理 → 点遮罩退出仍在外层整理态」路径。
   * 前置：默认网格含 id=f1 的「社交」文件夹。
   */
  test("should open folder arrange from expand pill and close overlay without exiting arrange mode", async ({ page }) => {
    await page.goto("/");

    await enterArrangeModeByDraggingToFirstItem(page);

    const folderRoot = page.locator('[data-grid-item-id="f1"]');
    await expect(folderRoot).toBeVisible();
    await folderRoot.click();

    const expandBtn = page.getByRole("button", { name: "展开整理" });
    await expect(expandBtn).toBeVisible();
    await expandBtn.click();

    const scrim = page.locator(".glass-scrim").first();
    await expect(scrim).toBeVisible();
    await scrim.click({ position: { x: 8, y: 8 } });

    await expect(page.locator(".glass-scrim")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "退出整理模式" })).toBeVisible();
  });

  /**
   * 目的：覆盖 B2-4 混合集拖拽路径：文件夹内多选后拖一项到外层，批量从文件夹移出。
   */
  test("should_move_selected_folder_inner_items_to_outer_grid_when_dragging_one_inner_item", async ({ page }) => {
    await page.goto("/");
    await waitForGridReady(page);
    const outerItems = page.locator("[data-grid-item-id]");
    await expect(outerItems.first()).toBeVisible();
    const beforeOuterCount = await outerItems.count();

    await enterArrangeModeByDraggingToFirstItem(page);
    const folderRoot = page.locator('[data-grid-item-id="f1"]');
    await expect(folderRoot).toBeVisible();
    await folderRoot.click();
    const expandBtn = page.getByRole("button", { name: "展开整理" });
    await expect(expandBtn).toBeVisible();
    await expandBtn.click();

    const innerItems = page.locator('[data-testid^="folder-inner-draggable-"]');
    const xItem = innerItems.nth(0);
    const discordItem = innerItems.nth(1);
    await expect(xItem).toBeVisible();
    await expect(discordItem).toBeVisible();
    await xItem.click();
    await discordItem.click();

    const outerIds = await outerItems.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-grid-item-id") ?? "").filter((id) => id.length > 0),
    );
    const dropTargetId = outerIds.find((id) => id !== "f1");
    expect(dropTargetId).toBeTruthy();
    if (!dropTargetId) return;
    const dropTarget = page.locator(`[data-grid-item-id="${dropTargetId}"]`);
    const startBox = await xItem.boundingBox();
    const dropBox = await dropTarget.boundingBox();
    expect(startBox).not.toBeNull();
    expect(dropBox).not.toBeNull();
    if (!startBox || !dropBox) return;

    await page.mouse.move(startBox.x + startBox.width / 2, startBox.y + startBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(startBox.x + startBox.width / 2 + 24, startBox.y + startBox.height / 2 + 24, { steps: 5 });
    await expect(page.getByTestId("folder-overlay-scrim")).toHaveClass(/pointer-events-none/);
    await page.mouse.move(dropBox.x + 8, dropBox.y + 8, { steps: 8 });
    await page.mouse.up();

    await expect(page.getByTestId("folder-overlay-scrim")).toHaveCount(0);
    await expect.poll(async () => page.locator("[data-grid-item-id]").count()).toBeGreaterThan(beforeOuterCount);
    const folderAfterDrag = page.locator('[data-grid-item-id="f1"]');
    if ((await folderAfterDrag.count()) > 0) {
      await folderAfterDrag.click();
      const remainInnerCount = await page.locator('[data-testid^="folder-inner-draggable-"]').count();
      expect(remainInnerCount).toBeLessThan(2);
      const scrim = page.getByTestId("folder-overlay-scrim");
      if ((await scrim.count()) > 0) {
        await scrim.click({ position: { x: 8, y: 8 } });
      }
    }
  });
});
