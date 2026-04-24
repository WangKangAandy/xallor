import type { MinimalDockEntry } from "./minimalDockTypes";

export function reorderMinimalDockEntries(entries: MinimalDockEntry[], fromIndex: number, toIndex: number): MinimalDockEntry[] {
  if (fromIndex === toIndex) return entries;
  if (fromIndex < 0 || fromIndex >= entries.length) return entries;
  if (toIndex < 0 || toIndex >= entries.length) return entries;
  const next = [...entries];
  const [removed] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, removed);
  return next;
}
