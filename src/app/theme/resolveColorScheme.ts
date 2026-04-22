import type { ColorSchemePreference } from "../preferences/colorSchemeStorage";

export type ResolvedColorScheme = "light" | "dark";

/** `prefersDark` 仅在 `preference === "system"` 时使用。 */
export function resolveColorScheme(
  preference: ColorSchemePreference,
  prefersDark: boolean,
): ResolvedColorScheme {
  if (preference === "light") return "light";
  if (preference === "dark") return "dark";
  return prefersDark ? "dark" : "light";
}

export function matchesPrefersColorSchemeDark(): boolean {
  return globalThis.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
}
