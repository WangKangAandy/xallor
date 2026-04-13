import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { GlassSurface } from "../shared/GlassSurface";
import { Z_ADD_ICON_DIALOG } from "../desktopGridLayers";
import { ADD_ICON_CATALOG, filterAddIconCatalog } from "./addIconCatalog";
import type { AddIconPickerFilter } from "./addIconPickerConstants";
import { AddIconPickerPanel } from "./AddIconPickerPanel";
import { AddIconPreviewPanel } from "./AddIconPreviewPanel";
import type { AddIconSubmitPayload } from "./addIconSubmitPayload";

export type { AddIconPickerFilter } from "./addIconPickerConstants";
export type { AddIconSubmitPayload } from "./addIconSubmitPayload";

export type AddIconDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * 触发添加入口的站点项 id。
   * TODO(stage A): 在 createWidgetFromCatalogEntry / 插入策略中消费该值，支持“插入到某项旁边”。
   */
  contextSiteId: string | null;
  /** 确认添加：写入当前桌面网格等；未传则仅关闭弹层（旧行为）。 */
  onConfirmAdd?: (payload: AddIconSubmitPayload) => void;
};

/**
 * 「添加图标」模块：无顶栏标题；左栏分区 + 右栏预览（含关闭）；目录见 `addIconCatalog.ts`。
 */
export function AddIconDialog({ open, onOpenChange, contextSiteId, onConfirmAdd }: AddIconDialogProps) {
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

  const handleClose = () => onOpenChange(false);

  const handleAdd = (payload: AddIconSubmitPayload) => {
    onConfirmAdd?.(payload);
    handleClose();
  };

  const handleContinueAdding = (payload: AddIconSubmitPayload) => {
    onConfirmAdd?.(payload);
    setSelectedCatalogId(null);
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-4"
      style={{ zIndex: Z_ADD_ICON_DIALOG }}
      role="presentation"
    >
      <button
        type="button"
        aria-label="关闭"
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px] transition-opacity"
        onClick={handleClose}
      />
      <GlassSurface
        variant="panel"
        rounded="3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] flex h-[min(640px,calc(100dvh-1.5rem))] max-h-[min(640px,calc(100dvh-1.5rem))] w-full max-w-5xl flex-col overflow-hidden shadow-2xl"
      >
        <span id={titleId} className="sr-only">
          添加图标
        </span>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <AddIconPickerPanel
            pickerFilter={pickerFilter}
            onPickerFilterChange={setPickerFilter}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            filteredEntries={filteredEntries}
            selectedId={selectedCatalogId}
            onSelectId={setSelectedCatalogId}
          />
          <AddIconPreviewPanel
            selected={selectedEntry}
            contextSiteId={contextSiteId}
            onClose={handleClose}
            onCancel={handleClose}
            onAdd={handleAdd}
            onContinueAdding={handleContinueAdding}
          />
        </div>
      </GlassSurface>
    </div>,
    document.body,
  );
}
