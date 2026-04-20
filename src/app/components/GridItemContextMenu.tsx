import type { Ref, RefObject } from "react";
import { Z_GRID_CONTEXT_MENU } from "./desktopGridLayers";
import type { GridContextMenuEntry } from "./gridItemContextMenuConfig";
import { GlassSurface } from "./shared/GlassSurface";
import { useAppI18n } from "../i18n/AppI18n";

type GridItemContextMenuProps = {
  menuRef: RefObject<HTMLDivElement | null>;
  left: number;
  top: number;
  entries: GridContextMenuEntry[];
  onEntrySelect: (entry: GridContextMenuEntry) => void;
};

/**
 * 网格卡片右键菜单 UI（无状态）；条目来自 {@link getGridItemContextMenuEntries}。
 * 外壳使用 {@link GlassSurface}，与搜索下拉里、天气卡等毛玻璃语言一致。
 */
export function GridItemContextMenu({ menuRef, left, top, entries, onEntrySelect }: GridItemContextMenuProps) {
  const { t } = useAppI18n();
  if (entries.length === 0) return null;

  return (
    <GlassSurface
      ref={menuRef as Ref<HTMLDivElement>}
      data-grid-context-menu
      data-ui-modal-overlay
      rounded="xl"
      className="fixed w-max min-w-[120px] max-w-[min(280px,calc(100vw-16px))] overflow-hidden py-1.5"
      style={{ left, top, zIndex: Z_GRID_CONTEXT_MENU }}
      role="menu"
      aria-label={t("contextMenu.itemActions")}
    >
      {entries.map((entry) => (
        <button
          key={entry.id}
          type="button"
          role="menuitem"
          className="flex w-full min-w-0 items-center gap-2 px-3.5 py-2.5 text-left text-[15px] font-normal leading-snug text-gray-700 transition-colors hover:bg-white/55"
          onClick={() => onEntrySelect(entry)}
        >
          {entry.label}
        </button>
      ))}
    </GlassSurface>
  );
}
