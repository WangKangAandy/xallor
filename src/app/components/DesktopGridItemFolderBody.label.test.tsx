/**
 * @vitest-environment jsdom
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { describe, expect, it } from "vitest";
import { UiPreferencesTestProvider } from "../preferences/UiPreferencesTestProvider";
import { DesktopGridItemFolderBody, type FolderTileChrome } from "./DesktopGridItemFolderBody";
import type { FolderItem } from "./desktopGridTypes";

const FOLDER_ITEM: FolderItem = {
  id: "folder-test",
  type: "folder",
  name: "社交",
  colorFrom: "rgba(147,197,253,0.75)",
  colorTo: "rgba(99,102,241,0.75)",
  shape: { cols: 2, rows: 2 },
  sites: [{ name: "Discord", domain: "discord.com", url: "https://discord.com" }],
};

const FOLDER_CHROME: FolderTileChrome = {
  viewportWidth: 180,
  viewportHeight: 180,
  canvasGrid: { cols: 2, rows: 2 },
  previewSites: FOLDER_ITEM.sites,
  iconSize: 48,
  horizontalGap: 12,
  verticalGap: 12,
  canvasWidth: 108,
  canvasHeight: 108,
  innerBorderRadius: 14,
  faviconSize: 24,
  anchorStyle: { left: "50%", top: "50%", transform: "translate(-50%, -50%)" },
  gridAlignContent: "center",
  gridJustifyContent: "center",
};

describe("DesktopGridItemFolderBody label visibility", () => {
  /**
   * 目的：保护文件夹卡片底部名称在 showLabels=true 时可见，避免容器裁剪导致标签消失回归。
   * 前置：渲染 folder body 且传入可见标签配置。
   * 预期：可在文档中找到文件夹名称文本。
   */
  it("should_show_folder_name_when_show_labels_is_true", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <DndProvider backend={HTML5Backend}>
          <UiPreferencesTestProvider>
          <DesktopGridItemFolderBody
            item={FOLDER_ITEM}
            isMergeTarget={false}
            isArrangeMode={false}
            isArrangeSelected={false}
            showLabels
            chrome={FOLDER_CHROME}
            onRename={() => {}}
            onOpenFolder={() => {}}
          />
          </UiPreferencesTestProvider>
        </DndProvider>,
      );
    });

    expect(container.textContent).toContain("社交");

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
