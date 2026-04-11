import { describe, expect, it } from "vitest";

describe("DesktopGrid module (code splitting entry)", () => {
  /**
   * 目的：`App` 使用 `React.lazy` 动态加载网格模块；若默认导出丢失或路径错误，构建/运行会失败。
   */
  it(
    "should_resolve_dynamic_import_and_export_DesktopGrid",
    async () => {
      const m = await import("./DesktopGrid");
      expect(m.DesktopGrid).toBeTypeOf("function");
    },
    20_000,
  );
});
