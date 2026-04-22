/** @vitest-environment jsdom */
import { act } from "react";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { describe, expect, it, vi } from "vitest";
import { AppI18nProvider } from "../i18n/AppI18n";
import { UiPreferencesTestProvider } from "../preferences/UiPreferencesTestProvider";
import { useArrangeSession } from "./arrange/useArrangeSession";
import { DesktopGrid } from "./DesktopGrid";
import type { GridItemType } from "./desktopGridTypes";

function DesktopGridHarness({ onOpenAddFromDesktop }: { onOpenAddFromDesktop?: () => void }) {
  const [items, setItems] = useState<GridItemType[]>([]);
  const arrangeSession = useArrangeSession();
  return (
    <DndProvider backend={HTML5Backend}>
      <AppI18nProvider>
        <UiPreferencesTestProvider>
          <DesktopGrid
            arrangeSession={arrangeSession}
            items={items}
            setItems={setItems}
            showLabels
            isHydrated
            onOpenAddFromDesktop={onOpenAddFromDesktop}
          />
        </UiPreferencesTestProvider>
      </AppI18nProvider>
    </DndProvider>
  );
}

describe("DesktopGrid add entry", () => {
  /**
   * 目的：验证桌面 “+” 按钮已改为触发“跳转到设置-站点与组件”入口回调，不再打开旧弹窗。
   * 前置：渲染空网格并注入回调；点击 AddSlot 的 “+”。
   * 预期：回调被调用且页面不存在对话框节点。
   */
  it("should_call_settings_entry_callback_when_clicking_desktop_add_button", () => {
    const onOpenAddFromDesktop = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<DesktopGridHarness onOpenAddFromDesktop={onOpenAddFromDesktop} />);
    });

    const openBtn = document.querySelector('button[aria-label="添加图标"]') as HTMLButtonElement | null;
    expect(openBtn).not.toBeNull();

    act(() => {
      openBtn?.click();
    });

    expect(onOpenAddFromDesktop).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
