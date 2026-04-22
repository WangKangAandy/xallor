import { describe, expect, it } from "vitest";
import { resolveColorScheme } from "./resolveColorScheme";

describe("resolveColorScheme", () => {
  it("should_ignore_prefersDark_when_preference_is_light_or_dark", () => {
    expect(resolveColorScheme("light", true)).toBe("light");
    expect(resolveColorScheme("dark", false)).toBe("dark");
  });

  it("should_follow_prefersDark_when_preference_is_system", () => {
    expect(resolveColorScheme("system", false)).toBe("light");
    expect(resolveColorScheme("system", true)).toBe("dark");
  });
});
