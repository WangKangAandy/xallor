/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { collectHitSelectionIds } from "./selectionEngine";

describe("collectHitSelectionIds", () => {
  /**
   * 目的：实时框选命中应支持同一格映射多个可选 id（如 folder 内部项）。
   */
  it("should_collect_all_mapped_selectable_ids_when_selection_intersects_grid_item", () => {
    const root = document.createElement("div");
    const item = document.createElement("div");
    item.setAttribute("data-grid-item-id", "folder-1");
    root.appendChild(item);

    Object.defineProperty(item, "getBoundingClientRect", {
      configurable: true,
      value: () =>
        ({
          left: 100,
          top: 100,
          right: 200,
          bottom: 200,
          width: 100,
          height: 100,
          x: 100,
          y: 100,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    const ids = collectHitSelectionIds(
      root,
      { left: 120, top: 120, right: 160, bottom: 160 },
      (gridItemId) => (gridItemId === "folder-1" ? ["a", "b"] : []),
    );
    expect(ids.sort()).toEqual(["a", "b"]);
  });
});
