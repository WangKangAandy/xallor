import { useEffect, useRef, useState } from "react";
import type { GridItemType } from "./desktopGridTypes";
import type { GridPayload } from "../storage/types";
import { loadGridPayload, saveGridPayload } from "../storage/repository";

const SAVE_DEBOUNCE_MS = 400;

export function useGridPersistence(fallback: GridPayload) {
  const [items, setItems] = useState<GridItemType[]>([]);
  const [showLabels, setShowLabels] = useState(true);
  const hydratedRef = useRef(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const persisted = await loadGridPayload(fallback);
      if (cancelled) return;
      setItems(persisted.items);
      setShowLabels(persisted.showLabels);
      hydratedRef.current = true;
      setIsHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [fallback]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const timer = globalThis.setTimeout(() => {
      void saveGridPayload({ items, showLabels });
    }, SAVE_DEBOUNCE_MS);
    return () => globalThis.clearTimeout(timer);
  }, [items, showLabels]);

  return { items, setItems, showLabels, setShowLabels, isHydrated };
}
