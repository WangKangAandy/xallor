import { useAddIconCatalogModel } from "./useAddIconCatalogModel";
import { AddIconPickerPanel } from "./AddIconPickerPanel";
import { AddIconPreviewPanel } from "./AddIconPreviewPanel";
import type { AddIconSubmitPayload } from "./addIconSubmitPayload";

type AddIconPanelContentProps = {
  contextSiteId: string | null;
  onConfirmAdd?: (payload: AddIconSubmitPayload) => void;
  onRequestClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
};

/**
 * AddIcon 内容层（不含 portal / scrim / body scroll lock）。
 * 供设置页等容器内嵌复用，保持一套选择与预览交互。
 */
export function AddIconPanelContent({
  contextSiteId,
  onConfirmAdd,
  onRequestClose,
  showCloseButton = true,
  className,
}: AddIconPanelContentProps) {
  const {
    pickerFilter,
    setPickerFilter,
    searchQuery,
    setSearchQuery,
    selectedCatalogId,
    setSelectedCatalogId,
    filteredEntries,
    selectedEntry,
  } = useAddIconCatalogModel();

  const handleClose = () => onRequestClose?.();
  const handleAdd = (payload: AddIconSubmitPayload) => {
    onConfirmAdd?.(payload);
    onRequestClose?.();
  };
  return (
    <div className={className ?? "flex min-h-0 min-w-0 flex-1 flex-col sm:flex-row"}>
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
        showCloseButton={showCloseButton}
      />
    </div>
  );
}
