import { describe, expect, it } from "vitest";
import { reorderGridItems, reorderGridItemsByPolicy } from "./useGridDnD";
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

  /**
   * 目的：当关闭自动补位策略时，hover 边区不应触发顺序重排，保证固定布局稳定。
   */
  it("should_not_reorder_when_auto_compact_is_disabled", () => {
    const items = [mk("a"), mk("b"), mk("c")];
    const next = reorderGridItemsByPolicy(items, "c", "a", { compactionStrategy: "no-compact", conflictStrategy: "eject" });
    expect(next.map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  /**
   * 目的：pinned 项作为拖拽源或目标时，不应因自动补位策略被重排。
   */
  it("should_not_reorder_when_dragged_or_target_item_is_pinned", () => {
    const items = [mk("a"), mk("b"), mk("c")];
    const pinned = new Set(["a"]);
    const next = reorderGridItemsByPolicy(items, "c", "a", {
      compactionStrategy: "compact",
      conflictStrategy: "eject",
      pinnedItemIds: pinned,
    });
    expect(next.map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  /**
   * 目的：冲突策略为 swap 时，拖拽源与目标应直接交换位置。
   */
  it("should_swap_positions_when_conflict_strategy_is_swap", () => {
    const items = [mk("a"), mk("b"), mk("c")];
    const next = reorderGridItemsByPolicy(items, "c", "a", { compactionStrategy: "compact", conflictStrategy: "swap" });
    expect(next.map((i) => i.id)).toEqual(["c", "b", "a"]);
  });

  /**
   * 目的：冲突策略为 reject 时，应拒绝重排并保持原顺序。
   */
  it("should_reject_reorder_when_conflict_strategy_is_reject", () => {
    const items = [mk("a"), mk("b"), mk("c")];
    const next = reorderGridItemsByPolicy(items, "c", "a", {
      compactionStrategy: "compact",
      conflictStrategy: "reject",
    });
    expect(next.map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  /**
   * 目的：eject 策略应保持现有“插入到目标前”的行为，作为默认冲突策略基线。
   */
  it("should_keep_insert_before_behavior_when_conflict_strategy_is_eject", () => {
    const items = [mk("a"), mk("b"), mk("c"), mk("d")];
    const next = reorderGridItemsByPolicy(items, "d", "b", {
      compactionStrategy: "compact",
      conflictStrategy: "eject",
    });
    expect(next.map((i) => i.id)).toEqual(["a", "d", "b", "c"]);
  });

  /**
   * 目的：no-compact 优先级高于冲突策略；即便是 swap 也不应发生重排。
   */
  it("should_not_reorder_when_no_compact_even_if_conflict_strategy_is_swap", () => {
    const items = [mk("a"), mk("b"), mk("c")];
    const next = reorderGridItemsByPolicy(items, "c", "a", {
      compactionStrategy: "no-compact",
      conflictStrategy: "swap",
    });
    expect(next.map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  /**
   * 目的：pinned 保护优先级高于冲突策略；target pinned 时 swap 也必须被阻止。
   */
  it("should_not_swap_when_target_is_pinned", () => {
    const items = [mk("a"), mk("b"), mk("c")];
    const next = reorderGridItemsByPolicy(items, "c", "a", {
      compactionStrategy: "compact",
      conflictStrategy: "swap",
      pinnedItemIds: new Set(["a"]),
    });
    expect(next.map((i) => i.id)).toEqual(["a", "b", "c"]);
  });
});
