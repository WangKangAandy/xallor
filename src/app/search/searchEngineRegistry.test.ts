import { describe, expect, it } from "vitest";
import {
  getAllSearchEngines,
  getBuiltinSearchEngineIcon,
  getSearchEngineById,
  getSearchEngineDisplayName,
  resolveSearchEngineId,
} from "./searchEngineRegistry";

describe("searchEngineRegistry", () => {
  it("should_resolve_to_baidu_when_stored_id_missing_or_invalid", () => {
    const engines = getAllSearchEngines();
    expect(resolveSearchEngineId(null, engines)).toBe("baidu");
    expect(resolveSearchEngineId("not-exist", engines)).toBe("baidu");
  });

  it("should_keep_stored_id_when_stored_id_exists_in_available_engines", () => {
    const engines = getAllSearchEngines();
    expect(resolveSearchEngineId("google", engines)).toBe("google");
  });

  it("should_return_engine_when_id_exists", () => {
    const engine = getSearchEngineById("baidu");
    expect(engine?.name).toBe("百度");
  });

  it("should_return_localized_display_name_for_builtin_baidu", () => {
    const engine = getSearchEngineById("baidu");
    expect(engine).not.toBeNull();
    expect(getSearchEngineDisplayName(engine!, "zh-CN")).toBe("百度");
    expect(getSearchEngineDisplayName(engine!, "en-US")).toBe("Baidu");
  });

  it("should_return_builtin_transparent_icon_data_for_core_search_engines", () => {
    expect(getBuiltinSearchEngineIcon("baidu")?.path.length).toBeGreaterThan(0);
    expect(getBuiltinSearchEngineIcon("google")?.path.length).toBeGreaterThan(0);
    expect(getBuiltinSearchEngineIcon("duckduckgo")?.path.length).toBeGreaterThan(0);
    expect(getBuiltinSearchEngineIcon("brave")?.path.length).toBeGreaterThan(0);
  });

  it("should_return_null_builtin_icon_for_custom_engine_id", () => {
    expect(getBuiltinSearchEngineIcon("custom-any")).toBeNull();
  });
});

