import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { GlassSurface } from "../shared/GlassSurface";
import { Z_ADD_ICON_DIALOG } from "../desktopGridLayers";
import { ADD_ICON_CATALOG, filterAddIconCatalog } from "./addIconCatalog";
import type { AddIconPickerFilter } from "./addIconPickerConstants";
import { AddIconDialogFooter } from "./AddIconDialogFooter";
import { AddIconDialogHeader } from "./AddIconDialogHeader";
import { AddIconPickerPanel } from "./AddIconPickerPanel";
import { AddIconPreviewPanel } from "./AddIconPreviewPanel";

export type { AddIconPickerFilter } from "./addIconPickerConstants";

export type AddIconDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 触发添加入口的站点项 id；后续用于「插入到该图标旁」等逻辑。 */
  contextSiteId: string | null;
};

/**
 * 「添加图标」模块：左栏主选区 + 右栏窄预览 + 底栏；目录数据见 `addIconCatalog.ts`。
 */
export function AddIconDialog({ open, onOpenChange, contextSiteId }: AddIconDialogProps) {
  const titleId = useId();
  const [pickerFilter, setPickerFilter] = useState<AddIconPickerFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);

  const filteredEntries = useMemo(
    () => filterAddIconCatalog(ADD_ICON_CATALOG, pickerFilter, searchQuery),
    [pickerFilter, searchQuery],
  );

  const selectedEntry = useMemo(
    () => ADD_ICON_CATALOG.find((e) => e.id === selectedCatalogId) ?? null,
    [selectedCatalogId],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  /** 打开时重置选择，避免上次残留。 */
  useEffect(() => {
    if (open) {
      setSelectedCatalogId(null);
      setSearchQuery("");
      setPickerFilter("all");
    }
  }, [open]);

  /** 当前选中项不在筛选结果内时清空选择。 */
  useEffect(() => {
    if (!selectedCatalogId) return;
    if (!filteredEntries.some((e) => e.id === selectedCatalogId)) {
      setSelectedCatalogId(null);
    }
  }, [filteredEntries, selectedCatalogId]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-5"
      style={{ zIndex: Z_ADD_ICON_DIALOG }}
      role="presentation"
    >
      <button
        type="button"
        aria-label="关闭"
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px] transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      <GlassSurface
        variant="panel"
        rounded="3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] flex w-full max-w-6xl flex-col overflow-hidden shadow-2xl min-h-[min(560px,88vh)] max-h-[min(880px,96vh)]"
      >
        <AddIconDialogHeader titleId={titleId} onClose={() => onOpenChange(false)} />

        <div className="flex min-h-0 flex-1 flex-col sm:min-h-[min(480px,72vh)] lg:min-h-[min(520px,75vh)] sm:flex-row">
          <AddIconPickerPanel
            pickerFilter={pickerFilter}
            onPickerFilterChange={setPickerFilter}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            filteredEntries={filteredEntries}
            selectedId={selectedCatalogId}
            onSelectId={setSelectedCatalogId}
          />
          <AddIconPreviewPanel selected={selectedEntry} contextSiteId={contextSiteId} />
        </div>

        <AddIconDialogFooter
          onSaveAndExit={() => onOpenChange(false)}
          onSaveAndContinue={() => onOpenChange(false)}
        />
      </GlassSurface>
    </div>,
    document.body,
  );
}
