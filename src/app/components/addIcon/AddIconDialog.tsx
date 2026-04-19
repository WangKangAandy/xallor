import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { GlassSurface } from "../shared/GlassSurface";
import { ModalScrim } from "../shared/ModalScrim";
import { Z_ADD_ICON_DIALOG } from "../desktopGridLayers";
import { AddIconPickerPanel } from "./AddIconPickerPanel";
import { AddIconPreviewPanel } from "./AddIconPreviewPanel";
import type { AddIconSubmitPayload } from "./addIconSubmitPayload";
import { useAddIconCatalogModel } from "./useAddIconCatalogModel";
import { useAppI18n } from "../../i18n/AppI18n";

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
  const { t } = useAppI18n();
  const titleId = useId();
  const {
    pickerFilter,
    setPickerFilter,
    searchQuery,
    setSearchQuery,
    selectedCatalogId,
    setSelectedCatalogId,
    filteredEntries,
    selectedEntry,
    resetForOpen,
  } = useAddIconCatalogModel();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevOverflowX = body.style.overflowX;
    const prevOverflowY = body.style.overflowY;
    // 弹层打开时锁定页面滚动，避免底层容器偶发横向溢出导致顶部出现横向滚动条。
    body.style.overflow = "hidden";
    body.style.overflowX = "hidden";
    body.style.overflowY = "hidden";
    return () => {
      body.style.overflow = prevOverflow;
      body.style.overflowX = prevOverflowX;
      body.style.overflowY = prevOverflowY;
    };
  }, [open]);

  /** 打开时重置选择，避免上次残留。 */
  useEffect(() => {
    if (open) {
      resetForOpen();
    }
  }, [open, resetForOpen]);

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
      className="fixed inset-0 flex items-center justify-center overflow-x-hidden p-3 sm:p-4"
      style={{ zIndex: Z_ADD_ICON_DIALOG }}
      role="presentation"
      data-ui-modal-overlay
      data-ui-surface="add-icon"
    >
      <ModalScrim aria-label={t("addIcon.closeDialog")} onClick={handleClose} />
      <GlassSurface
        variant="panel"
        rounded="3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] flex h-[min(680px,calc(100dvh-1.5rem))] max-h-[min(680px,calc(100dvh-1.5rem))] w-full max-w-[min(1400px,92vw)] flex-col overflow-hidden shadow-2xl"
      >
        <span id={titleId} className="sr-only">
          {t("addIcon.dialogTitle")}
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
            onAdd={handleAdd}
            onContinueAdding={handleContinueAdding}
          />
        </div>
      </GlassSurface>
    </div>,
    document.body,
  );
}
