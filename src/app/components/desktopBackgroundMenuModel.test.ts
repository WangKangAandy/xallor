import { describe, expect, it, vi } from "vitest";
import { buildDesktopBackgroundMenuEntries, type DesktopBackgroundMenuLabels } from "./desktopBackgroundMenuModel";

const LABELS: DesktopBackgroundMenuLabels = {
  addSiteOrComponent: "添加站点 & 组件",
  downloadWallpaper: "下载壁纸",
  switchWallpaper: "更换壁纸",
  downloadingWallpaper: "下载中...",
  arrangeMode: "整理模式",
};

describe("buildDesktopBackgroundMenuEntries", () => {
  /**
   * 目的：极简模式下背景菜单应走独立管理逻辑，不暴露网格专属入口。
   * 前置：layoutMode=minimal，且传入所有可选动作回调。
   * 预期：仅返回壁纸相关项，不包含「添加站点 & 组件」与「整理模式」。
   */
  it("should_exclude_grid_management_entries_when_layout_is_minimal", () => {
    const entries = buildDesktopBackgroundMenuEntries({
      layoutMode: "minimal",
      onEnterArrangeMode: vi.fn(),
      onOpenAddSiteOrComponent: vi.fn(),
      onDownloadWallpaper: vi.fn(),
      onSwitchWallpaper: vi.fn(),
      labels: LABELS,
    });
    const ids = entries.map((e) => e.id);
    expect(ids).toContain("download-wallpaper");
    expect(ids).toContain("switch-wallpaper");
    expect(ids).not.toContain("add-site-or-component");
    expect(ids).not.toContain("arrange-mode");
  });
});
