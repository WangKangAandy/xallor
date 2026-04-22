/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import type { SiteItem } from "./components/desktopGridTypes";
import type { AddIconSubmitPayload } from "./components/addIcon";
import { useSettingsDesktopIntegration } from "./useSettingsDesktopIntegration";

type IntegrationSnapshot = ReturnType<typeof useSettingsDesktopIntegration>;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function mountSettingsDesktopIntegrationHarness() {
  let latest: IntegrationSnapshot | null = null;
  const removeHiddenItemsByIds = vi.fn();

  const hiddenItem: SiteItem = {
    id: "hidden-a",
    type: "site",
    shape: { cols: 1, rows: 1 },
    site: { name: "A", domain: "a.com", url: "https://a.com" },
  };

  function Harness() {
    const integration = useSettingsDesktopIntegration({
      isSettingsOpen: true,
      settingsInitialSection: "widgets",
      closeSettings: vi.fn(),
      layoutMode: "default",
      setLayoutMode: vi.fn(),
      openLinksInNewTab: true,
      setOpenLinksInNewTab: vi.fn(),
      hiddenSpace: {
        isEnabled: true,
        hiddenItems: [hiddenItem],
        isDev: false,
        enableWithPassword: vi.fn(async () => {}),
        verifyPassword: vi.fn(async () => true),
        clearAllAndDisable: vi.fn(),
        removeHiddenItemsByIds,
        resetFolderWarnedInDev: vi.fn(),
      },
    });
    useEffect(() => {
      latest = integration;
    }, [integration]);
    return null;
  }

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<Harness />);
  });

  const getLatest = () => {
    if (!latest) throw new Error("integration not ready");
    return latest;
  };
  const cleanup = () => {
    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  };

  return { getLatest, cleanup, removeHiddenItemsByIds };
}

describe("useSettingsDesktopIntegration", () => {
  /**
   * 目的：设置恢复动作写入的恢复队列应在桌面应用后清空，避免重复恢复。
   * 前置：先通过 settingsActions 注入 restore items，再调用 onRestoreApplied。
   * 预期：removeHiddenItemsByIds 被调用且 restoreItems 归零。
   */
  it("should_clear_restore_items_after_restore_applied", () => {
    const harness = mountSettingsDesktopIntegrationHarness();
    const restoreItems: SiteItem[] = [
      {
        id: "r-1",
        type: "site",
        shape: { cols: 1, rows: 1 },
        site: { name: "R", domain: "r.com", url: "https://r.com" },
      },
    ];
    act(() => {
      harness.getLatest().settingsActions.onRestoreHiddenItems(restoreItems);
    });
    expect(harness.getLatest().restoreItems).toEqual(restoreItems);
    act(() => {
      harness.getLatest().onRestoreApplied(["r-1"]);
    });
    expect(harness.removeHiddenItemsByIds).toHaveBeenCalledWith(["r-1"]);
    expect(harness.getLatest().restoreItems).toEqual([]);
    harness.cleanup();
  });

  /**
   * 目的：设置新增 payload 在桌面消费后必须清空，避免重复注入网格。
   * 前置：通过 settingsActions 追加两个 payload，再调用 onAddPayloadsConsumed。
   * 预期：pendingAddPayloads 由 2 项归零。
   */
  it("should_clear_pending_add_payloads_after_consumed", () => {
    const harness = mountSettingsDesktopIntegrationHarness();
    const p1: AddIconSubmitPayload = {
      kind: "site",
      site: { name: "S1", domain: "s1.com", url: "https://s1.com" },
    };
    const p2: AddIconSubmitPayload = {
      kind: "site",
      site: { name: "S2", domain: "s2.com", url: "https://s2.com" },
    };
    act(() => {
      harness.getLatest().settingsActions.onAddItemFromSettings(p1);
      harness.getLatest().settingsActions.onAddItemFromSettings(p2);
    });
    expect(harness.getLatest().pendingAddPayloads).toEqual([p1, p2]);
    act(() => {
      harness.getLatest().onAddPayloadsConsumed();
    });
    expect(harness.getLatest().pendingAddPayloads).toEqual([]);
    harness.cleanup();
  });

  /**
   * 目的：集成层应透传 settingsState 关键标记，保证设置弹窗渲染判定稳定。
   * 前置：以 widgets 分区打开且非极简布局。
   * 预期：open=true、initialSection=widgets、isMinimalMode=false。
   */
  it("should_expose_settings_state_snapshot_for_modal_rendering", () => {
    const harness = mountSettingsDesktopIntegrationHarness();
    expect(harness.getLatest().settingsState.open).toBe(true);
    expect(harness.getLatest().settingsState.initialSection).toBe("widgets");
    expect(harness.getLatest().settingsState.isMinimalMode).toBe(false);
    harness.cleanup();
  });
});
