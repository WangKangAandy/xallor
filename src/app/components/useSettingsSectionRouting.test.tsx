/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { useEffect, useState } from "react";
import { useSettingsSectionRouting } from "./useSettingsSectionRouting";

type RoutingSnapshot = ReturnType<typeof useSettingsSectionRouting>;

// React 18 act() warning suppression for createRoot-based hook harness.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function mountRoutingHarness(initialOpen = true, initialSection: "general" | "privacy" = "general") {
  let latest: RoutingSnapshot | null = null;
  let setOpen: ((open: boolean) => void) | null = null;
  const onSearchNavigates = vi.fn();

  function Harness() {
    const [open, setOpenState] = useState(initialOpen);
    setOpen = setOpenState;
    const routing = useSettingsSectionRouting({
      open,
      initialSection,
      onSearchNavigates,
    });
    useEffect(() => {
      latest = routing;
    }, [routing]);
    return null;
  }

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<Harness />);
  });

  const getLatest = () => {
    if (!latest) throw new Error("routing not ready");
    return latest;
  };
  const toggleOpen = (next: boolean) => {
    if (!setOpen) throw new Error("setOpen not ready");
    act(() => {
      setOpen?.(next);
    });
  };
  const cleanup = () => {
    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  };

  return { getLatest, toggleOpen, cleanup, onSearchNavigates };
}

describe("useSettingsSectionRouting", () => {
  /**
   * 目的：打开设置时应按 initialSection 定位，保证外部入口跳转一致。
   * 前置：`open=true` 且 initialSection 为 privacy。
   * 预期：activeSection 初始化为 privacy。
   */
  it("should_initialize_active_section_when_opened_with_initial_section", () => {
    const harness = mountRoutingHarness(true, "privacy");
    expect(harness.getLatest().activeSection).toBe("privacy");
    harness.cleanup();
  });

  /**
   * 目的：搜索命中分区时应自动跳转并通知外部关闭下拉等附属 UI。
   * 前置：输入“主题”关键词。
   * 预期：activeSection 变为 appearance 且触发 onSearchNavigates。
   */
  it("should_switch_section_and_emit_navigation_when_query_matches", async () => {
    const harness = mountRoutingHarness(true, "general");
    act(() => {
      harness.getLatest().setSettingsSearchQuery("主题");
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(harness.getLatest().activeSection).toBe("appearance");
    expect(harness.onSearchNavigates).toHaveBeenCalled();
    harness.cleanup();
  });

  /**
   * 目的：无匹配关键词时应暴露空态标记供 UI 渲染反馈。
   * 前置：输入无关词 `zzz-no-match`。
   * 预期：isSettingsSearchNoResult 为 true。
   */
  it("should_mark_no_result_when_query_has_no_match", () => {
    const harness = mountRoutingHarness(true, "general");
    act(() => {
      harness.getLatest().setSettingsSearchQuery("zzz-no-match");
    });
    expect(harness.getLatest().isSettingsSearchNoResult).toBe(true);
    harness.cleanup();
  });

  /**
   * 目的：重新打开设置弹窗时应清空搜索词，避免上次会话残留。
   * 前置：先关闭再打开，并在关闭前写入搜索词。
   * 预期：settingsSearchQuery 重置为空字符串。
   */
  it("should_reset_search_query_when_modal_reopened", () => {
    const harness = mountRoutingHarness(true, "general");
    act(() => {
      harness.getLatest().setSettingsSearchQuery("主题");
    });
    harness.toggleOpen(false);
    harness.toggleOpen(true);
    expect(harness.getLatest().settingsSearchQuery).toBe("");
    harness.cleanup();
  });
});
