import { createPortal } from "react-dom";
import { useDrag } from "react-dnd";
import type { FolderItem, Site } from "./desktopGridTypes";
import { EditableLabel, Favicon } from "./DesktopGridItemPrimitives";

function FolderInnerItem({
  site,
  folderId,
  showLabels = true,
  onDragStart,
  onDragEnd,
  onRename,
}: {
  site: Site;
  folderId: string;
  showLabels?: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onRename: (newName: string) => void;
}) {
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
    <a
      ref={drag}
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        if (isDragging) {
          e.preventDefault();
        }
      }}
      className={`flex flex-col items-center ${showLabels ? "justify-start" : "justify-center"} group w-[100px] ${showLabels ? "gap-2" : "gap-0"} cursor-grab active:cursor-grabbing ${isDragging ? "opacity-0" : "opacity-100"}`}
    >
      <div className="w-[84px] h-[84px] shrink-0 rounded-[24px] bg-white/80 border border-white/90 flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:bg-white pointer-events-none">
        <div ref={dragPreview}>
          <Favicon domain={site.domain} name={site.name} size={48} />
        </div>
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
  );
}

export function DesktopGridFolderPortal({
  folder,
  showLabels,
  isFolderDragging,
  onClose,
  onRenameFolder,
  onRenameInnerSite,
  onInnerDragStart,
  onInnerDragEnd,
}: {
  folder: FolderItem;
  showLabels: boolean;
  isFolderDragging: boolean;
  onClose: () => void;
  onRenameFolder: (newName: string) => void;
  onRenameInnerSite: (siteUrl: string, newName: string) => void;
  onInnerDragStart: () => void;
  onInnerDragEnd: () => void;
}) {
  return createPortal(
    /* z-[100]：高于主内容 z-10 / 侧栏 z-30；全页装饰层勿盖过此处，见 desktopGridLayers.ts */
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-2xl transition-all ${isFolderDragging ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      onClick={() => onClose()}
    >
      <div
        className="bg-white/70 backdrop-blur-3xl border border-white/80 rounded-[44px] p-10 pb-12 w-[90%] max-w-[640px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] animate-in zoom-in duration-200 pointer-events-auto transition-all duration-300"
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
              onDragStart={onInnerDragStart}
              onDragEnd={onInnerDragEnd}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
