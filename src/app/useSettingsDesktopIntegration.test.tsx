/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SiteItem } from "./components/desktopGridTypes";
import type { AddIconSubmitPayload } from "./components/addIcon";
import { MINIMAL_DOCK_PENDING_RESTORE_KEY } from "./minimalDock";
import { UiPreferencesProvider } from "./preferences";
import type { LayoutMode } from "./preferences";
import { useSettingsDesktopIntegration } from "./useSettingsDesktopIntegration";

type IntegrationSnapshot = ReturnType<typeof useSettingsDesktopIntegration>;

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function mountSettingsDesktopIntegrationHarness(options?: { layoutMode?: LayoutMode }) {
  let latest: IntegrationSnapshot | null = null;
  const removeHiddenItemsByIds = vi.fn();
  const layoutMode = options?.layoutMode ?? "default";

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
      layoutMode,
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
    root.render(
      <UiPreferencesProvider>
        <Harness />
      </UiPreferencesProvider>,
    );
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
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

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
   * 目的：极简且 Dock 关闭时「放回」只进待恢复队列，不得从隐藏列表移除。
   * 前置：localStorage 布局为 minimal、Dock 关闭；调用 onRestoreHiddenItems。
   * 预期：removeHiddenItemsByIds 未调用；sessionStorage 队列含该项。
   */
  it("should_queue_restore_to_session_when_minimal_and_dock_hidden_without_removing_hidden", () => {
    localStorage.setItem("xallor_ui_layout", "minimal");
    localStorage.setItem("xallor_ui_minimal_dock_mode", "off");
    const harness = mountSettingsDesktopIntegrationHarness({ layoutMode: "minimal" });
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
    expect(harness.removeHiddenItemsByIds).not.toHaveBeenCalled();
    const raw = sessionStorage.getItem(MINIMAL_DOCK_PENDING_RESTORE_KEY);
    expect(raw).toBeTruthy();
    const queued = JSON.parse(raw ?? "[]") as SiteItem[];
    expect(queued.some((i) => i.id === "r-1")).toBe(true);
    harness.cleanup();
  });

  /**
   * 目的：极简且 Dock 开启时「放回」应直接写入 Dock 并对已落槽项 removeHidden。
   * 前置：minimal + Dock 开；调用 onRestoreHiddenItems。
   * 预期：removeHiddenItemsByIds 以隐藏项 id 调用；restoreItems 仍为空（不经网格队列）。
   */
  it("should_restore_to_dock_and_remove_hidden_when_minimal_and_dock_visible", () => {
    localStorage.setItem("xallor_ui_layout", "minimal");
    localStorage.setItem("xallor_ui_minimal_dock_visible", "1");
    const harness = mountSettingsDesktopIntegrationHarness({ layoutMode: "minimal" });
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
    expect(harness.removeHiddenItemsByIds).toHaveBeenCalledWith(["r-1"]);
    expect(harness.getLatest().restoreItems).toEqual([]);
    expect(harness.getLatest().minimalDockEntries.some((e) => e.kind === "site")).toBe(true);
    harness.cleanup();
  });

  /**
   * 目的：Dock 从关到开时应冲刷 session 队列，成功落 Dock 后再 removeHidden。
   * 前置：session 队列已有项；挂载时 minimal + Dock 可见。
   * 预期：removeHiddenItemsByIds 被调用；session 队列清空或缩减。
   */
  it("should_flush_pending_queue_on_dock_becoming_visible_and_then_remove_hidden", () => {
    const queued: SiteItem[] = [
      {
        id: "q-1",
        type: "site",
        shape: { cols: 1, rows: 1 },
        site: { name: "Q", domain: "q.com", url: "https://q.com" },
      },
    ];
    sessionStorage.setItem(MINIMAL_DOCK_PENDING_RESTORE_KEY, JSON.stringify(queued));
    localStorage.setItem("xallor_ui_layout", "minimal");
    localStorage.setItem("xallor_ui_minimal_dock_mode", "pinned");
    const harness = mountSettingsDesktopIntegrationHarness({ layoutMode: "minimal" });
    expect(harness.removeHiddenItemsByIds).toHaveBeenCalledWith(["q-1"]);
    expect(readSessionQueueIds()).not.toContain("q-1");
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

function readSessionQueueIds(): string[] {
  try {
    const raw = sessionStorage.getItem(MINIMAL_DOCK_PENDING_RESTORE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x: { id?: string }) => x.id).filter(Boolean) as string[];
  } catch {
    return [];
  }
}
