/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  __resetApplyColorSchemeStateForTests,
  applyColorScheme,
  XALLOR_THEME_CHANGE_EVENT,
} from "./applyColorScheme";

describe("applyColorScheme", () => {
  afterEach(() => {
    __resetApplyColorSchemeStateForTests();
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "";
  });

  /**
   * 目的：幂等早退不写 DOM；连续相同 resolved 不触发 theme-change。
   */
  it("should_skip_dom_and_event_when_resolved_unchanged_after_first_apply", () => {
    const spy = vi.fn();
    globalThis.addEventListener(XALLOR_THEME_CHANGE_EVENT, spy);

    applyColorScheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(spy).not.toHaveBeenCalled();

    applyColorScheme("light");
    expect(spy).not.toHaveBeenCalled();

    applyColorScheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(spy).toHaveBeenCalledTimes(1);

    globalThis.removeEventListener(XALLOR_THEME_CHANGE_EVENT, spy);
  });
});
