/**
 * @vitest-environment jsdom
 */
import { act, createElement, useState, type MutableRefObject } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import type { GridItemType } from "./desktopGridTypes";
import { useDesktopGridItemMutations } from "./useDesktopGridItemMutations";

function site(id: string, name: string, url: string): GridItemType {
  return {
    id,
    type: "site",
    shape: { cols: 1, rows: 1 },
    site: { name, url, domain: "example.com" },
  };
}

function MutationsHarness({
  initialItems,
  initialOpenFolderId,
  apiRef,
  itemsRef,
  openRef,
}: {
  initialItems: GridItemType[];
  initialOpenFolderId: string | null;
  apiRef: MutableRefObject<ReturnType<typeof useDesktopGridItemMutations> | null>;
  itemsRef: MutableRefObject<GridItemType[]>;
  openRef: MutableRefObject<string | null>;
}) {
  const [items, setItems] = useState(initialItems);
  const [openFolderId, setOpenFolderId] = useState<string | null>(initialOpenFolderId);
  const api = useDesktopGridItemMutations(setItems, setOpenFolderId);
  apiRef.current = api;
  itemsRef.current = items;
  openRef.current = openFolderId;
  return null;
}

describe("useDesktopGridItemMutations", () => {
  /**
   * 目的：重命名站点后应只更新对应项的展示名，防止拆出 hook 后回归为全表替换错误。
   * 前置：网格含两个站点。
   * 预期：`handleRename` 后仅目标 id 的 name 变化。
   */
  it("should_rename_site_item_when_handle_rename_called", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const apiRef: MutableRefObject<ReturnType<typeof useDesktopGridItemMutations> | null> = { current: null };
    const itemsRef: MutableRefObject<GridItemType[]> = { current: [] };
    const openRef: MutableRefObject<string | null> = { current: null };

    act(() => {
      root.render(
        createElement(MutationsHarness, {
          initialItems: [site("a", "A", "https://a"), site("b", "B", "https://b")],
          initialOpenFolderId: null,
          apiRef,
          itemsRef,
          openRef,
        }),
      );
    });

    act(() => {
      apiRef.current?.handleRename("b", "B2");
    });

    const items = itemsRef.current;
    const a = items.find((i) => i.id === "a");
    const b = items.find((i) => i.id === "b");
    expect(a?.type === "site" && a.site.name).toBe("A");
    expect(b?.type === "site" && b.site.name).toBe("B2");

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  /**
   * 目的：删除当前打开的文件夹时应同步清空 `openFolderId`，避免 Portal 仍指向已删 id。
   * 前置：`openFolderId` 指向将被删除的文件夹 id。
   * 预期：`handleDeleteItem` 后该项移除且 `openFolderId` 为 null。
   */
  it("should_clear_open_folder_id_when_deleted_folder_matches_open", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const apiRef: MutableRefObject<ReturnType<typeof useDesktopGridItemMutations> | null> = { current: null };
    const itemsRef: MutableRefObject<GridItemType[]> = { current: [] };
    const openRef: MutableRefObject<string | null> = { current: null };

    const folder: GridItemType = {
      id: "f1",
      type: "folder",
      shape: { cols: 1, rows: 1 },
      name: "F",
      colorFrom: "#334155",
      colorTo: "#0f172a",
      sites: [],
    };

    act(() => {
      root.render(
        createElement(MutationsHarness, {
          initialItems: [folder],
          initialOpenFolderId: "f1",
          apiRef,
          itemsRef,
          openRef,
        }),
      );
    });

    act(() => {
      apiRef.current?.handleDeleteItem("f1");
    });

    expect(itemsRef.current).toHaveLength(0);
    expect(openRef.current).toBeNull();

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
