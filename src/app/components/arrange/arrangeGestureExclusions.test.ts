/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { isArrangeGestureExcludedStartTarget } from "./arrangeGestureExclusions";

describe("isArrangeGestureExcludedStartTarget", () => {
  /**
   * 目的：实体卡片本体不允许作为框选起手点。
   */
  it("should_exclude_grid_item_targets_when_starting_gesture", () => {
    const node = document.createElement("div");
    node.setAttribute("data-grid-item-id", "x-1");
    document.body.appendChild(node);
    expect(isArrangeGestureExcludedStartTarget(node)).toBe(true);
    document.body.removeChild(node);
  });

  /**
   * 目的：搜索框区域需要被排除，避免与搜索交互冲突。
   */
  it("should_exclude_search_bar_targets_when_starting_gesture", () => {
    const root = document.createElement("div");
    root.setAttribute("data-search-bar-root", "true");
    const child = document.createElement("span");
    root.appendChild(child);
    document.body.appendChild(root);
    expect(isArrangeGestureExcludedStartTarget(child)).toBe(true);
    document.body.removeChild(root);
  });

  /**
   * 目的：侧栏等仍可用 `data-arrange-gesture-exclude` 单独声明排除。
   */
  it("should_exclude_descendants_when_root_has_data_arrange_gesture_exclude", () => {
    const root = document.createElement("div");
    root.setAttribute("data-arrange-gesture-exclude", "true");
    const inner = document.createElement("div");
    root.appendChild(inner);
    document.body.appendChild(root);
    expect(isArrangeGestureExcludedStartTarget(inner)).toBe(true);
    document.body.removeChild(root);
  });

  /**
   * 目的：统一契约 `data-ui-modal-overlay` — 任意子节点（含非 button 文案区）均不发起整理起手。
   */
  it("should_exclude_descendants_under_data_ui_modal_overlay", () => {
    const root = document.createElement("div");
    root.setAttribute("data-ui-modal-overlay", "true");
    const inner = document.createElement("div");
    root.appendChild(inner);
    document.body.appendChild(root);
    expect(isArrangeGestureExcludedStartTarget(inner)).toBe(true);
    document.body.removeChild(root);
  });
});
