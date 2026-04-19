import { createPortal } from "react-dom";
import { useDrag } from "react-dnd";
import { useOpenExternalUrl } from "../navigation";
import type { FolderItem, Site } from "./desktopGridTypes";
import { EditableLabel, Favicon } from "./DesktopGridItemPrimitives";
import { GlassSurface } from "./shared/GlassSurface";

function FolderInnerItem({
  site,
  folderId,
  showLabels = true,
  onDragStart,
  onDragEnd,
  onRename,
  isArrangeMode = false,
  isArrangeSelected = false,
  onArrangeToggleSelect,
  onDeleteSite,
}: {
  site: Site;
  folderId: string;
  showLabels?: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onRename: (newName: string) => void;
  isArrangeMode?: boolean;
  isArrangeSelected?: boolean;
  onArrangeToggleSelect?: () => void;
  onDeleteSite?: () => void;
}) {
  const openUrl = useOpenExternalUrl();
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: "ITEM",
    item: () => {
      onDragStart();
      return { id: `folder-item-${folderId}-${site.url}`, type: "folder-site", sourceFolderId: folderId, site };
    },
    end: () => {
      onDragEnd();
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div className="relative">
      <a
        ref={drag}
        data-testid={`folder-inner-draggable-${encodeURIComponent(site.url)}`}
        href={site.url}
        onClick={(e) => {
          if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          if (isArrangeMode) {
            e.preventDefault();
            e.stopPropagation();
            onArrangeToggleSelect?.();
            return;
          }
          e.preventDefault();
          openUrl(site.url, e);
        }}
        onAuxClick={(e) => {
          if (e.button !== 1) return;
          if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          if (isArrangeMode) {
            e.preventDefault();
            e.stopPropagation();
            onArrangeToggleSelect?.();
            return;
          }
          e.preventDefault();
          openUrl(site.url, e);
        }}
        className={[
          `group flex flex-col items-center ${showLabels ? "justify-start" : "justify-center"} w-[100px] ${showLabels ? "gap-2" : "gap-0"} cursor-grab active:cursor-grabbing ${isDragging ? "opacity-0" : "opacity-100"}`,
        ].join(" ")}
      >
        <div className="pointer-events-none shrink-0 transition-transform duration-200 group-hover:scale-105">
          <GlassSurface
            variant="tile"
            rounded="none"
            className="!rounded-[24px] flex h-[84px] w-[84px] items-center justify-center shadow-sm group-hover:bg-white/80"
            style={
              isArrangeMode && isArrangeSelected
                ? {
                    boxShadow: "inset 0 0 0 2px rgba(59,130,246,0.95), inset 0 0 0 3px rgba(255,255,255,0.2)",
                  }
                : undefined
            }
          >
            <div ref={dragPreview}>
              <Favicon domain={site.domain} name={site.name} size={48} />
            </div>
          </GlassSurface>
        </div>
        <EditableLabel
          initialName={site.name}
          onRename={onRename}
          showLabels={showLabels}
          className="text-[13px] text-gray-700 font-medium text-center truncate w-[100px] pointer-events-auto"
          inputClassName="text-gray-700 text-center"
          inputStyle={{ width: "120%", fontSize: 13, fontWeight: 500 }}
        />
      </a>
      {isArrangeMode ? (
        <>
          <button
            type="button"
            aria-label="删除当前文件夹内图标"
            data-arrange-delete="true"
            className="absolute right-1 top-1 z-[2] flex h-5 w-5 items-center justify-center rounded-full border border-white/80 bg-black/20 text-xs text-white transition hover:bg-red-500/80"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDeleteSite?.();
            }}
          >
            ×
          </button>
        </>
      ) : null}
    </div>
  );
}

export function DesktopGridFolderPortal({
  folder,
  showLabels,
  isFolderDragging,
  onClose,
  onRenameFolder,
  onRenameInnerSite,
  isArrangeMode = false,
  isArrangeSelected,
  onArrangeToggleSelect,
  onDeleteInnerSite,
  onInnerDragStart,
  onInnerDragEnd,
}: {
  folder: FolderItem;
  showLabels: boolean;
  isFolderDragging: boolean;
  onClose: () => void;
  onRenameFolder: (newName: string) => void;
  onRenameInnerSite: (siteUrl: string, newName: string) => void;
  isArrangeMode?: boolean;
  isArrangeSelected?: (siteUrl: string) => boolean;
  onArrangeToggleSelect?: (siteUrl: string) => void;
  onDeleteInnerSite?: (siteUrl: string) => void;
  onInnerDragStart: () => void;
  onInnerDragEnd: () => void;
}) {
  return createPortal(
    /* z-[100]：高于主内容 z-10 / 侧栏 z-30；全页装饰层勿盖过此处，见 desktopGridLayers.ts */
    <div
      data-testid="folder-overlay-scrim"
      className={`glass-scrim fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all ${isFolderDragging ? "pointer-events-none opacity-0" : "opacity-100"}`}
      onClick={() => onClose()}
    >
      <GlassSurface
        variant="panel"
        rounded="none"
        className="animate-in zoom-in pointer-events-auto w-[90%] max-w-[640px] rounded-[44px] p-10 pb-12 transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-8 mx-auto w-full max-w-[80%]">
          <EditableLabel
            initialName={folder.name}
            onRename={onRenameFolder}
            className="text-center text-3xl font-semibold text-gray-800 tracking-wide cursor-text hover:bg-black/5 px-4 py-1 rounded transition-colors truncate"
            inputClassName="text-center text-3xl font-semibold text-gray-800 tracking-wide focus:outline-none bg-black/5 px-4 py-1 rounded"
            inputStyle={{ maxWidth: "100%" }}
            autoWidth={true}
          />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] justify-items-center transition-all duration-300 gap-x-6 gap-y-6">
          {folder.sites.map((site, i) => (
            <FolderInnerItem
              key={site.url + i}
              site={site}
              folderId={folder.id}
              showLabels={showLabels}
              onRename={(newName) => onRenameInnerSite(site.url, newName)}
              isArrangeMode={isArrangeMode}
              isArrangeSelected={isArrangeSelected?.(site.url) ?? false}
              onArrangeToggleSelect={() => onArrangeToggleSelect?.(site.url)}
              onDeleteSite={() => onDeleteInnerSite?.(site.url)}
              onDragStart={onInnerDragStart}
              onDragEnd={onInnerDragEnd}
            />
          ))}
        </div>
      </GlassSurface>
    </div>,
    document.body,
  );
}
