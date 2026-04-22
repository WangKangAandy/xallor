import { describe, expect, it } from "vitest";
import { resolveCompactionStrategy, resolveConflictStrategy } from "./layoutSchema";

describe("layoutSchema strategy resolver", () => {
  /**
   * 目的：新旧字段并存期间，若存在新枚举策略，应优先采用新字段避免语义歧义。
   */
  it("should_prioritize_compaction_strategy_over_legacy_auto_compact_flag", () => {
    const out = resolveCompactionStrategy({
      widgets: [],
      layout: [],
      compactionStrategy: "compact",
      autoCompactEnabled: false,
    });
    expect(out).toBe("compact");
  });

  /**
   * 目的：兼容旧数据：无新策略字段时，false 应映射为 no-compact。
   */
  it("should_fallback_to_no_compact_when_legacy_auto_compact_flag_is_false", () => {
    const out = resolveCompactionStrategy({
      widgets: [],
      layout: [],
      autoCompactEnabled: false,
    });
    expect(out).toBe("no-compact");
  });

  /**
   * 目的：冲突策略缺省时必须回退到 eject，确保运行时行为稳定。
   */
  it("should_default_conflict_strategy_to_eject_when_missing", () => {
    const out = resolveConflictStrategy({ widgets: [], layout: [] });
    expect(out).toBe("eject");
  });
});
