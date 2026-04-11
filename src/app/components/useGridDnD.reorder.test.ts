import { describe, expect, it } from "vitest";
import { reorderGridItems } from "./useGridDnD";
import type { GridItemType } from "./desktopGridTypes";

const mk = (id: string): GridItemType => ({
  id,
  type: "site",
  shape: { cols: 1, rows: 1 },
  site: { name: id, domain: `${id}.test`, url: `https://${id}.test` },
});

/**
 * 目的：DnD 重排抽成纯函数后，交换两项顺序必须稳定且不丢项，避免 hook 重构导致网格顺序错乱。
 */
describe("reorderGridItems", () => {
  it("should_move_dragged_item_before_hover_when_dragged_was_after_hover", () => {
    const items = [mk("a"), mk("b"), mk("c")];
    const next = reorderGridItems(items, "c", "a");
    expect(next.map((i) => i.id)).toEqual(["c", "a", "b"]);
  });

  it("should_noop_when_ids_equal_or_missing", () => {
    const items = [mk("a"), mk("b")];
    expect(reorderGridItems(items, "a", "a")).toEqual(items);
    expect(reorderGridItems(items, "x", "b")).toEqual(items);
  });
});
