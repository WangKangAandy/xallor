/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { describe, expect, it } from "vitest";
import { createRoot } from "react-dom/client";
import { AppI18nProvider } from "../../i18n/AppI18n";
import { AddIconPickerTile } from "./AddIconPickerTile";

const githubSite = {
  kind: "site" as const,
  id: "cat-site-github",
  name: "GitHub",
  domain: "github.com",
  url: "https://github.com",
};

describe("AddIconPickerTile", () => {
  /**
   * 目的：选中态用青色描边表达焦点，避免浅色主题 `--primary` 近黑造成「黑框」。
   * 前置：站点磁贴 selected=true。
   * 预期：按钮 class 含 cyan 选中描边且 aria-selected 为 true。
   */
  it("should_apply_cyan_selection_border_when_site_tile_selected", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <AppI18nProvider>
          <AddIconPickerTile entry={githubSite} selected onSelect={() => {}} />
        </AppI18nProvider>,
      );
    });

    const btn = container.querySelector("button[role='option']");
    expect(btn).toBeTruthy();
    expect(btn!.className).toContain("border-cyan-500");
    expect(btn!.getAttribute("aria-selected")).toBe("true");

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
