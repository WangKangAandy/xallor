/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { SiteItem } from "./components/desktopGridTypes";
import type { AddIconSubmitPayload } from "./components/addIcon";
import { useSettingsSpotlightBindings } from "./useSettingsSpotlightBindings";

type BindingsSnapshot = ReturnType<typeof useSettingsSpotlightBindings>;

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function mountBindingsHarness(params?: { verifyOk?: boolean }) {
  const verifyOk = params?.verifyOk ?? true;
  let latest: BindingsSnapshot | null = null;
  let restoreQueueState: SiteItem[] = [];
  let settingsAddQueueState: AddIconSubmitPayload[] = [];
  const closeSettings = vi.fn();
  const setLayoutMode = vi.fn();
  const setOpenLinksInNewTab = vi.fn();
  const enableWithPassword = vi.fn(async () => {});
  const verifyPassword = vi.fn(async () => verifyOk);
  const clearAllAndDisable = vi.fn();
  const removeHiddenItemsByIds = vi.fn();
  const resetFolderWarnedInDev = vi.fn();

  const hiddenItem: SiteItem = {
    id: "hidden-1",
    type: "site",
    shape: { cols: 1, rows: 1 },
    site: { name: "A", domain: "a.com", url: "https://a.com" },
  };

  function Harness() {
    const [restoreQueue, setRestoreQueue] = useState<SiteItem[]>([]);
    const [settingsAddQueue, setSettingsAddQueue] = useState<AddIconSubmitPayload[]>([]);
    restoreQueueState = restoreQueue;
    settingsAddQueueState = settingsAddQueue;

    const bindings = useSettingsSpotlightBindings({
      isSettingsOpen: true,
      settingsInitialSection: "privacy",
      closeSettings,
      layoutMode: "default",
      setLayoutMode,
      openLinksInNewTab: true,
      setOpenLinksInNewTab,
      hiddenSpace: {
        isEnabled: true,
        hiddenItems: [hiddenItem],
        isDev: true,
        enableWithPassword,
        verifyPassword,
        clearAllAndDisable,
        removeHiddenItemsByIds,
        resetFolderWarnedInDev,
      },
      minimalDockMode: "auto_hide",
      onRestoreHiddenItems: (items) => setRestoreQueue(items),
      onAddItemFromSettings: (p) => setSettingsAddQueue((prev) => [...prev, p]),
    });
    useEffect(() => {
      latest = bindings;
    }, [bindings]);
    return null;
  }

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<Harness />);
  });

  const getLatest = () => {
    if (!latest) throw new Error("bindings not ready");
    return latest;
  };
  const cleanup = () => {
    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  };

  return {
    getLatest,
    cleanup,
    verifyPassword,
    clearAllAndDisable,
    getRestoreQueueState: () => restoreQueueState,
    getSettingsAddQueueState: () => settingsAddQueueState,
  };
}

describe("useSettingsSpotlightBindings", () => {
  /**
   * 目的：禁用隐私空间时需要先校验密码；校验失败不得执行清空动作。
   * 前置：verifyPassword 返回 false。
   * 预期：onDisableHiddenSpace 返回 false，且 clearAllAndDisable 不被调用。
   */
  it("should_not_disable_hidden_space_when_password_verification_fails", async () => {
    const harness = mountBindingsHarness({ verifyOk: false });
    let result = true;
    await act(async () => {
      result = await harness.getLatest().settingsActions.onDisableHiddenSpace("wrong");
    });
    expect(result).toBe(false);
    expect(harness.verifyPassword).toHaveBeenCalledWith("wrong");
    expect(harness.clearAllAndDisable).not.toHaveBeenCalled();
    harness.cleanup();
  });

  /**
   * 目的：密码验证通过后应执行禁用清理，确保状态与数据同时回收。
   * 前置：verifyPassword 返回 true。
   * 预期：onDisableHiddenSpace 返回 true，并调用 clearAllAndDisable。
   */
  it("should_disable_hidden_space_when_password_verification_succeeds", async () => {
    const harness = mountBindingsHarness({ verifyOk: true });
    let result = false;
    await act(async () => {
      result = await harness.getLatest().settingsActions.onDisableHiddenSpace("ok");
    });
    expect(result).toBe(true);
    expect(harness.clearAllAndDisable).toHaveBeenCalledTimes(1);
    harness.cleanup();
  });

  /**
   * 目的：设置弹窗动作应维护队列写入语义（恢复队列覆盖、添加队列追加）。
   * 前置：分别调用 onRestoreHiddenItems 与两次 onAddItemFromSettings。
   * 预期：restoreQueue 等于传入值，settingsAddQueue 保持追加顺序。
   */
  it("should_update_restore_and_add_queues_with_expected_semantics", () => {
    const harness = mountBindingsHarness();
    const restoreItems: SiteItem[] = [
      {
        id: "r1",
        type: "site",
        shape: { cols: 1, rows: 1 },
        site: { name: "R", domain: "r.com", url: "https://r.com" },
      },
    ];
    const payload1 = { kind: "site" as const, site: { name: "S1", domain: "s1.com", url: "https://s1.com" } };
    const payload2 = { kind: "site" as const, site: { name: "S2", domain: "s2.com", url: "https://s2.com" } };
    act(() => {
      harness.getLatest().settingsActions.onRestoreHiddenItems(restoreItems);
      harness.getLatest().settingsActions.onAddItemFromSettings(payload1);
      harness.getLatest().settingsActions.onAddItemFromSettings(payload2);
    });
    expect(harness.getRestoreQueueState()).toEqual(restoreItems);
    expect(harness.getSettingsAddQueueState()).toEqual([payload1, payload2]);
    harness.cleanup();
  });
});
