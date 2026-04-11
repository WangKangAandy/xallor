import { describe, expect, it } from "vitest";
import { DEFAULT_GRID_PAYLOAD } from "../components/desktopGridInitialItems";
import { isValidGridPayload } from "../storage/repository";

/**
 * 防止内置 defaultGrid.json 损坏或脱离 GridPayload 形状导致运行时抛错。
 */
describe("defaultGrid.json", () => {
  it("should_parse_to_valid_GridPayload_when_bundled_defaults_are_loaded", () => {
    expect(isValidGridPayload(DEFAULT_GRID_PAYLOAD)).toBe(true);
    expect(DEFAULT_GRID_PAYLOAD.items.length).toBeGreaterThan(0);
    expect(typeof DEFAULT_GRID_PAYLOAD.showLabels).toBe("boolean");
  });
});
