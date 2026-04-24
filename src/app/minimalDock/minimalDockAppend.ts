import { MINIMAL_DOCK_MAX_SLOTS } from "./minimalDockConstants";
import type { MinimalDockEntry, MinimalDockSiteEntry } from "./minimalDockTypes";
import type { Site, SiteItem } from "../components/desktopGridTypes";

function makeUniqueSiteEntryId(base: string, existingIds: Set<string>): string {
  if (!existingIds.has(base)) return base;
  let i = 1;
  while (existingIds.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

/**
 * 将站点追加到 Dock 条目列表，受 `MINIMAL_DOCK_MAX_SLOTS` 限制。
 * @returns appendedSiteEntryIds — 对应传入 `SiteItem.id`（用于从隐藏空间移除）；remaining — 未写入的项
 */
export function appendSiteItemsToMinimalDockEntries(
  entries: MinimalDockEntry[],
  items: SiteItem[],
): { nextEntries: MinimalDockEntry[]; appendedSiteEntryIds: string[]; remaining: SiteItem[] } {
  const next = [...entries];
  const existingIds = new Set(next.map((e) => e.id));
  const appendedSiteEntryIds: string[] = [];
  const remaining: SiteItem[] = [];

  for (const item of items) {
    if (item.type !== "site") {
      remaining.push(item);
      continue;
    }
    if (next.length >= MINIMAL_DOCK_MAX_SLOTS) {
      remaining.push(item);
      continue;
    }
    const dockId = makeUniqueSiteEntryId(item.id, existingIds);
    existingIds.add(dockId);
    const siteEntry: MinimalDockSiteEntry = {
      kind: "site",
      id: dockId,
      site: { ...item.site } as Site,
    };
    next.push(siteEntry);
    appendedSiteEntryIds.push(item.id);
  }

  return { nextEntries: next, appendedSiteEntryIds, remaining };
}
