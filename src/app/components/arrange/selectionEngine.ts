import { intersectsRect, rectFromDomRect, type SelectionRect } from "./selectionMath";

export type ResolveSelectableIdsByGridItemId = (gridItemId: string) => string[];

/**
 * 对当前框选矩形做命中扫描：返回所有命中的“可选择 id”集合。
 */
export function collectHitSelectionIds(
  root: HTMLElement | null,
  selection: SelectionRect,
  resolveSelectableIdsByGridItemId: ResolveSelectableIdsByGridItemId,
): string[] {
  if (!root) return [];
  const hitSet = new Set<string>();
  const elements = root.querySelectorAll<HTMLElement>("[data-grid-item-id]");
  elements.forEach((el) => {
    const gridItemId = el.dataset.gridItemId;
    if (!gridItemId) return;
    const cardRect = rectFromDomRect(el.getBoundingClientRect());
    if (!intersectsRect(selection, cardRect)) return;
    resolveSelectableIdsByGridItemId(gridItemId).forEach((id) => hitSet.add(id));
  });
  return Array.from(hitSet);
}
