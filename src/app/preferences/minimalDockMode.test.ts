import { describe, expect, it } from "vitest";
import { parseStoredMinimalDockMode } from "./minimalDockMode";

describe("parseStoredMinimalDockMode", () => {
  it("should_accept_new_storage_values", () => {
    expect(parseStoredMinimalDockMode("off", null)).toBe("off");
    expect(parseStoredMinimalDockMode("auto_hide", null)).toBe("auto_hide");
    expect(parseStoredMinimalDockMode("pinned", null)).toBe("pinned");
  });

  it("should_migrate_legacy_visible_flag_when_mode_key_missing", () => {
    expect(parseStoredMinimalDockMode(null, "0")).toBe("off");
    expect(parseStoredMinimalDockMode("", "1")).toBe("auto_hide");
  });

  it("should_default_to_auto_hide_when_both_missing", () => {
    expect(parseStoredMinimalDockMode(null, null)).toBe("auto_hide");
  });
});
