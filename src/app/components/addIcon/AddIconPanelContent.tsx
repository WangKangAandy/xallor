import { useAddIconCatalogModel } from "./useAddIconCatalogModel";
import { AddIconPickerPanel } from "./AddIconPickerPanel";
import { AddIconPreviewPanel } from "./AddIconPreviewPanel";
import type { AddIconSubmitPayload } from "./addIconSubmitPayload";

type AddIconPanelContentProps = {
  contextSiteId: string | null;
  onConfirmAdd?: (payload: AddIconSubmitPayload) => void;
  onRequestClose?: () => void;
  showCloseButton?: boolean;
  /** 设置内嵌时由外壳传入，与 `SettingsSpotlightModal` 的极简布局一致。 */
  isMinimalMode?: boolean;
  /** 极简模式下 Dock 栏是否开启（来自 `UiPreferences`）。 */
  minimalDockVisible?: boolean;
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
  isMinimalMode = false,
  minimalDockVisible = true,
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
        isMinimalMode={isMinimalMode}
        minimalDockVisible={minimalDockVisible}
      />
    </div>
  );
}
