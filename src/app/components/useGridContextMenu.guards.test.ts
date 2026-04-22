/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { shouldBypassCustomContextMenu } from "./useGridContextMenu";

describe("shouldBypassCustomContextMenu", () => {
  /**
   * 目的：输入语义区域应放行原生右键，避免被自定义菜单抢占。
   */
  it("should_return_true_when_target_is_editable_input", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    expect(shouldBypassCustomContextMenu(input)).toBe(true);
    document.body.removeChild(input);
  });

  /**
   * 目的：显式标记 data-context-native 区域应放行原生语义。
   */
  it("should_return_true_when_target_is_marked_as_native_context", () => {
    const box = document.createElement("div");
    box.setAttribute("data-context-native", "true");
    document.body.appendChild(box);
    expect(shouldBypassCustomContextMenu(box)).toBe(true);
    document.body.removeChild(box);
  });

  /**
   * 目的：禁用区应跳过自定义菜单，避免拖拽/动画等态被意外打断。
   */
  it("should_return_true_when_target_is_under_context_disabled", () => {
    const disabled = document.createElement("div");
    disabled.setAttribute("data-context-disabled", "true");
    const child = document.createElement("span");
    disabled.appendChild(child);
    document.body.appendChild(disabled);
    expect(shouldBypassCustomContextMenu(child)).toBe(true);
    document.body.removeChild(disabled);
  });

  /**
   * 目的：普通非输入区域应允许自定义菜单继续执行。
   */
  it("should_return_false_when_target_is_plain_element", () => {
    const plain = document.createElement("div");
    document.body.appendChild(plain);
    expect(shouldBypassCustomContextMenu(plain)).toBe(false);
    document.body.removeChild(plain);
  });
});

