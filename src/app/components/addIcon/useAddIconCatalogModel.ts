import { useCallback, useEffect, useMemo, useState } from "react";
import { ADD_ICON_CATALOG, filterAddIconCatalog, type AddIconCatalogEntry } from "./addIconCatalog";
import type { AddIconPickerFilter } from "./addIconPickerConstants";
import { resolveQuickSiteCandidate } from "./siteCandidateResolver";

export type AddIconCatalogModel = {
  pickerFilter: AddIconPickerFilter;
  setPickerFilter: (next: AddIconPickerFilter) => void;
  searchQuery: string;
  setSearchQuery: (next: string) => void;
  selectedCatalogId: string | null;
  setSelectedCatalogId: (next: string | null) => void;
  filteredEntries: AddIconCatalogEntry[];
  selectedEntry: AddIconCatalogEntry | null;
  resetForOpen: () => void;
};

/**
 * AddIcon 目录编排层：
 * - 统一筛选、URL 快速候选注入、选中项保持逻辑
 * - 让 Dialog 专注于视图与提交事件
 */
export function useAddIconCatalogModel(): AddIconCatalogModel {
  const [pickerFilter, setPickerFilter] = useState<AddIconPickerFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);

  const filteredEntriesBase = useMemo(
    () => filterAddIconCatalog(ADD_ICON_CATALOG, pickerFilter, searchQuery),
    [pickerFilter, searchQuery],
  );
  const quickSiteEntry = useMemo(() => resolveQuickSiteCandidate(searchQuery, ADD_ICON_CATALOG), [searchQuery]);

  const filteredEntries = useMemo(() => {
    if (!quickSiteEntry) return filteredEntriesBase;
    if (pickerFilter === "components") return filteredEntriesBase;
    if (filteredEntriesBase.some((entry) => entry.id === quickSiteEntry.id)) return filteredEntriesBase;
    return [quickSiteEntry, ...filteredEntriesBase];
  }, [filteredEntriesBase, quickSiteEntry, pickerFilter]);

  const selectableEntries = useMemo(
    () => (quickSiteEntry ? [quickSiteEntry, ...ADD_ICON_CATALOG] : ADD_ICON_CATALOG),
    [quickSiteEntry],
  );
  const selectedEntry = useMemo(
    () => selectableEntries.find((entry) => entry.id === selectedCatalogId) ?? quickSiteEntry ?? null,
    [selectableEntries, selectedCatalogId, quickSiteEntry],
  );

  useEffect(() => {
    if (!selectedCatalogId) return;
    if (!filteredEntries.some((entry) => entry.id === selectedCatalogId)) {
      setSelectedCatalogId(null);
    }
  }, [filteredEntries, selectedCatalogId]);

  useEffect(() => {
    if (!quickSiteEntry) return;
    setSelectedCatalogId((prev) => prev ?? quickSiteEntry.id);
  }, [quickSiteEntry]);

  const resetForOpen = useCallback(() => {
    setSelectedCatalogId(null);
    setSearchQuery("");
    setPickerFilter("all");
  }, []);

  return {
    pickerFilter,
    setPickerFilter,
    searchQuery,
    setSearchQuery,
    selectedCatalogId,
    setSelectedCatalogId,
    filteredEntries,
    selectedEntry,
    resetForOpen,
  };
}

