import { useCallback, useMemo, useState } from "react";
import type { GridItemType, Site, SiteItem } from "../components/desktopGridTypes";

const HIDDEN_SPACE_PREF_KEY = "xallor_hidden_space_pref";
const HIDDEN_SPACE_ITEMS_KEY = "xallor_hidden_space_items";
const HIDDEN_FOLDER_WARNED_KEY = "xallor_hidden_folder_warned";

type HiddenSpacePref = {
  enabled: boolean;
  passwordHash: string | null;
};

type HiddenSpaceItemsPayload = {
  items: SiteItem[];
};

function readPref(): HiddenSpacePref {
  try {
    const raw = globalThis.localStorage?.getItem(HIDDEN_SPACE_PREF_KEY);
    if (!raw) return { enabled: false, passwordHash: null };
    const parsed = JSON.parse(raw) as Partial<HiddenSpacePref>;
    const enabled = parsed.enabled === true;
    const passwordHash = typeof parsed.passwordHash === "string" ? parsed.passwordHash : null;
    if (enabled && !passwordHash) return { enabled: false, passwordHash: null };
    return { enabled, passwordHash };
  } catch {
    return { enabled: false, passwordHash: null };
  }
}

function readItems(): SiteItem[] {
  try {
    const raw = globalThis.localStorage?.getItem(HIDDEN_SPACE_ITEMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<HiddenSpaceItemsPayload>;
    return Array.isArray(parsed.items) ? parsed.items.filter((item) => item?.type === "site") : [];
  } catch {
    return [];
  }
}

function writePref(next: HiddenSpacePref) {
  globalThis.localStorage?.setItem(HIDDEN_SPACE_PREF_KEY, JSON.stringify(next));
}

function writeItems(items: SiteItem[]) {
  globalThis.localStorage?.setItem(HIDDEN_SPACE_ITEMS_KEY, JSON.stringify({ items } satisfies HiddenSpaceItemsPayload));
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function asHiddenSiteItem(site: Site, suffix: string): SiteItem {
  return {
    id: `hidden-site-${suffix}`,
    type: "site",
    shape: { cols: 1, rows: 1 },
    site: { ...site },
  };
}

export type HiddenCandidate = { type: "site"; item: SiteItem } | { type: "folder"; item: Extract<GridItemType, { type: "folder" }> };

export function useHiddenSpace() {
  const isDev = /^(localhost|127\.0\.0\.1)$/i.test(globalThis.location?.hostname ?? "");
  const [pref, setPref] = useState<HiddenSpacePref>(() => readPref());
  const [items, setItems] = useState<SiteItem[]>(() => readItems());
  const [folderWarned, setFolderWarned] = useState<boolean>(() => globalThis.localStorage?.getItem(HIDDEN_FOLDER_WARNED_KEY) === "1");

  const persistPref = useCallback((next: HiddenSpacePref) => {
    setPref(next);
    writePref(next);
  }, []);
  const persistItems = useCallback((next: SiteItem[]) => {
    setItems(next);
    writeItems(next);
  }, []);

  const verifyPassword = useCallback(
    async (plainText: string) => {
      if (!pref.passwordHash) return false;
      return (await sha256(plainText)) === pref.passwordHash;
    },
    [pref.passwordHash],
  );

  const enableWithPassword = useCallback(
    async (plainText: string) => {
      const passwordHash = await sha256(plainText);
      persistPref({ enabled: true, passwordHash });
    },
    [persistPref],
  );

  const clearAllAndDisable = useCallback(() => {
    persistItems([]);
    persistPref({ enabled: false, passwordHash: null });
  }, [persistItems, persistPref]);

  const hideCandidates = useCallback(
    (candidates: HiddenCandidate[]) => {
      const existingUrls = new Set(items.map((item) => item.site.url));
      const additions: SiteItem[] = [];
      candidates.forEach((candidate, index) => {
        if (candidate.type === "site") {
          const url = candidate.item.site.url;
          if (existingUrls.has(url)) return;
          existingUrls.add(url);
          additions.push({ ...candidate.item });
          return;
        }
        candidate.item.sites.forEach((site, siteIndex) => {
          if (existingUrls.has(site.url)) return;
          existingUrls.add(site.url);
          additions.push(asHiddenSiteItem(site, `${Date.now()}-${index}-${siteIndex}`));
        });
      });
      if (additions.length === 0) return;
      persistItems([...items, ...additions]);
    },
    [items, persistItems],
  );

  const removeHiddenItemsByIds = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      persistItems(items.filter((item) => !idSet.has(item.id)));
    },
    [items, persistItems],
  );

  const markFolderWarned = useCallback(() => {
    setFolderWarned(true);
    globalThis.localStorage?.setItem(HIDDEN_FOLDER_WARNED_KEY, "1");
  }, []);

  const resetFolderWarnedInDev = useCallback(() => {
    setFolderWarned(false);
    globalThis.localStorage?.removeItem(HIDDEN_FOLDER_WARNED_KEY);
  }, []);

  const value = useMemo(
    () => ({
      isEnabled: pref.enabled,
      hiddenItems: items,
      folderWarned,
      isDev,
      verifyPassword,
      enableWithPassword,
      clearAllAndDisable,
      hideCandidates,
      removeHiddenItemsByIds,
      markFolderWarned,
      resetFolderWarnedInDev,
    }),
    [
      pref.enabled,
      items,
      folderWarned,
      isDev,
      verifyPassword,
      enableWithPassword,
      clearAllAndDisable,
      hideCandidates,
      removeHiddenItemsByIds,
      markFolderWarned,
      resetFolderWarnedInDev,
    ],
  );

  return value;
}

