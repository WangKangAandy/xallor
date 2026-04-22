import { describe, expect, it, vi } from "vitest";
import { requestHideGridItem } from "./useHideItemRequest";
import type { FolderItem, SiteItem, WidgetItem } from "./components/desktopGridTypes";
import type { HiddenCandidate } from "./hiddenSpace/useHiddenSpace";

const siteItem: SiteItem = {
  id: "s1",
  type: "site",
  shape: { cols: 1, rows: 1 },
  site: {
    name: "Example",
    domain: "example.com",
    url: "https://example.com",
  },
};

const folderItem: FolderItem = {
  id: "f1",
  type: "folder",
  shape: { cols: 1, rows: 1 },
  name: "Folder",
  colorFrom: "#111",
  colorTo: "#222",
  sites: [siteItem.site],
};

const widgetItem: WidgetItem = {
  id: "w1",
  type: "widget",
  shape: { cols: 2, rows: 1 },
  widgetType: "weather",
};

function createDeps(overrides?: {
  isHiddenSpaceEnabled?: boolean;
  isFolderWarned?: boolean;
  folderConfirmOk?: boolean;
}) {
  const hideCandidates = vi.fn<(candidates: HiddenCandidate[]) => void>();
  const showEnableHint = vi.fn();
  const requestFolderConfirm = vi.fn(async () => overrides?.folderConfirmOk ?? true);
  const markFolderWarned = vi.fn();
  return {
    isHiddenSpaceEnabled: overrides?.isHiddenSpaceEnabled ?? true,
    isFolderWarned: overrides?.isFolderWarned ?? false,
    showEnableHint,
    requestFolderConfirm,
    markFolderWarned,
    hideCandidates,
  };
}

describe("requestHideGridItem", () => {
  /**
   * 目的：隐私空间未开启时应阻断隐藏并提示用户先开启功能。
   * 前置：`isHiddenSpaceEnabled = false`。
   * 预期：返回 false，调用 showEnableHint，且不触发 hideCandidates。
   */
  it("should_block_and_show_hint_when_hidden_space_is_disabled", async () => {
    const deps = createDeps({ isHiddenSpaceEnabled: false });
    const ok = await requestHideGridItem(siteItem, deps);
    expect(ok).toBe(false);
    expect(deps.showEnableHint).toHaveBeenCalledTimes(1);
    expect(deps.hideCandidates).not.toHaveBeenCalled();
  });

  /**
   * 目的：widget 类型不允许进入隐藏空间，避免无意义或不受支持的数据写入。
   * 前置：传入 widget item。
   * 预期：返回 false，且不触发任何确认与隐藏动作。
   */
  it("should_ignore_widget_item_when_requesting_hide", async () => {
    const deps = createDeps({ isHiddenSpaceEnabled: true });
    const ok = await requestHideGridItem(widgetItem, deps);
    expect(ok).toBe(false);
    expect(deps.requestFolderConfirm).not.toHaveBeenCalled();
    expect(deps.hideCandidates).not.toHaveBeenCalled();
  });

  /**
   * 目的：首次隐藏文件夹时若用户取消确认，应中止流程并不写入隐藏候选。
   * 前置：folderWarned=false 且 requestFolderConfirm 返回 false。
   * 预期：返回 false，不调用 markFolderWarned/hideCandidates。
   */
  it("should_abort_when_folder_confirm_is_rejected", async () => {
    const deps = createDeps({ isFolderWarned: false, folderConfirmOk: false });
    const ok = await requestHideGridItem(folderItem, deps);
    expect(ok).toBe(false);
    expect(deps.requestFolderConfirm).toHaveBeenCalledTimes(1);
    expect(deps.markFolderWarned).not.toHaveBeenCalled();
    expect(deps.hideCandidates).not.toHaveBeenCalled();
  });

  /**
   * 目的：站点项在通过前置检查后应写入隐藏候选并返回成功。
   * 前置：隐私空间已开启，传入 site item。
   * 预期：返回 true，hideCandidates 被调用一次并携带 site 候选。
   */
  it("should_push_site_candidate_when_request_is_allowed", async () => {
    const deps = createDeps({ isHiddenSpaceEnabled: true });
    const ok = await requestHideGridItem(siteItem, deps);
    expect(ok).toBe(true);
    expect(deps.hideCandidates).toHaveBeenCalledWith([{ type: "site", item: siteItem }]);
  });
});
