/** @vitest-environment jsdom */
import { act } from "react";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { describe, expect, it } from "vitest";
import { AppI18nProvider } from "../i18n/AppI18n";
import { useArrangeSession } from "./arrange/useArrangeSession";
import { DesktopGrid } from "./DesktopGrid";
import type { GridItemType } from "./desktopGridTypes";

function DesktopGridHarness() {
  const [items, setItems] = useState<GridItemType[]>([]);
  const arrangeSession = useArrangeSession();
  return (
    <DndProvider backend={HTML5Backend}>
      <AppI18nProvider>
        <DesktopGrid arrangeSession={arrangeSession} items={items} setItems={setItems} showLabels isHydrated />
      </AppI18nProvider>
    </DndProvider>
  );
}

async function waitForBodyText(text: string, timeoutMs = 1200) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if ((document.body.textContent ?? "").includes(text)) {
      return;
    }
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
  }
  throw new Error(`Timed out waiting for text: ${text}`);
}

describe("DesktopGrid add flow", () => {
  /**
   * 目的：验证“添加图标”链路能真实写入网格，而非仅关闭弹窗。
   * 前置：空网格渲染；通过首格 AddSlot 打开弹窗后选中左栏第一站点并点击“添加”。
   * 预期：弹窗关闭且网格中出现新增站点标签（GitHub）。
   */
  it("should_append_site_item_to_grid_when_add_confirmed_from_dialog", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<DesktopGridHarness />);
    });

    const openBtn = document.querySelector('button[aria-label="添加图标"]') as HTMLButtonElement | null;
    expect(openBtn).not.toBeNull();

    act(() => {
      openBtn?.click();
    });

    const siteSection = document.querySelector('section[aria-label="站点"]');
    const firstSiteTile = siteSection?.querySelector('[role="option"]') as HTMLButtonElement | null;
    expect(firstSiteTile).not.toBeNull();

    act(() => {
      firstSiteTile?.click();
    });

    const addBtn = Array.from(document.querySelectorAll("button")).find((btn) => btn.textContent?.trim() === "添加") as
      | HTMLButtonElement
      | undefined;
    expect(addBtn).toBeDefined();

    act(() => {
      addBtn?.click();
    });

    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.textContent).toContain("GitHub");

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  /**
   * 目的：验证天气组件已打通“目录选择 -> 提交 payload -> 创建 widget item -> 网格渲染”全链路。
   * 前置：打开添加弹层，切到「组件」分区并选中「天气」，点击“添加”。
   * 预期：弹层关闭且网格中出现天气卡片内容（Tokyo, Japan）。
   */
  it("should_render_weather_widget_when_weather_component_added_from_catalog", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<DesktopGridHarness />);
    });

    const openBtn = document.querySelector('button[aria-label="添加图标"]') as HTMLButtonElement | null;
    expect(openBtn).not.toBeNull();
    act(() => {
      openBtn?.click();
    });

    const componentSection = document.querySelector('section[aria-label="组件"]');
    expect(componentSection).not.toBeNull();
    const weatherTile = Array.from(componentSection?.querySelectorAll('[role="option"]') ?? []).find((el) =>
      (el as HTMLElement).textContent?.includes("天气"),
    ) as HTMLButtonElement | undefined;
    expect(weatherTile).toBeDefined();
    act(() => {
      weatherTile?.click();
    });

    const addBtn = Array.from(document.querySelectorAll("button")).find((btn) => btn.textContent?.trim() === "添加") as
      | HTMLButtonElement
      | undefined;
    expect(addBtn).toBeDefined();
    act(() => {
      addBtn?.click();
    });

    expect(document.querySelector('[role="dialog"]')).toBeNull();
    // 天气文案依赖异步拉取，弱网下需更长等待窗口
    await waitForBodyText("Tokyo, Japan", 8000);
    expect(document.body.textContent).toContain("Tokyo, Japan");

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
