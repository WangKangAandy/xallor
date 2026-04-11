import { GRID_DND_CENTER_ZONE_MARGIN_RATIO } from "./desktopGridConstants";

type RectLike = Pick<DOMRect, "width" | "height" | "left" | "top">;

/**
 * 指针是否落在格子「中心区」（四边各 marginRatio 为边区）。
 * 用于合并意图与 drop 时是否算「落入文件夹中心」。
 */
export function isCenterZone(
  rect: RectLike,
  clientX: number,
  clientY: number,
  marginRatio: number = GRID_DND_CENTER_ZONE_MARGIN_RATIO,
): boolean {
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const tx = rect.width * marginRatio;
  const ty = rect.height * marginRatio;
  return x > tx && x < rect.width - tx && y > ty && y < rect.height - ty;
}
