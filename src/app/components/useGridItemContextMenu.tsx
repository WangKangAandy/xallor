import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getGridItemContextMenuEntries } from "./gridItemContextMenuConfig";
import type { GridContextMenuEntry } from "./gridItemContextMenuConfig";
import { GridItemContextMenu } from "./GridItemContextMenu";

type MenuPos = { x: number; y: number };

/** 与菜单 `w-max` 实际宽度同量级，用于视口边缘夹紧。 */
const MENU_MIN_WIDTH = 128;
const MENU_MIN_HEIGHT = 44;

function clampMenuPosition(x: number, y: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    left: Math.max(8, Math.min(x, vw - MENU_MIN_WIDTH - 8)),
    top: Math.max(8, Math.min(y, vh - MENU_MIN_HEIGHT - 8)),
  };
}

/**
 * 网格卡片右键菜单：打开/关闭、全局点外部关闭；菜单内容由配置生成。
 */
export function useGridItemContextMenu(itemId: string, onDeleteItem?: (id: string) => void) {
  const [menu, setMenu] = useState<MenuPos | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const entries = useMemo(() => getGridItemContextMenuEntries(itemId, onDeleteItem), [itemId, onDeleteItem]);

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (entries.length === 0) return;
      e.preventDefault();
      e.stopPropagation();
      setMenu({ x: e.clientX, y: e.clientY });
    },
    [entries],
  );

  useEffect(() => {
    if (!menu) return;
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const handleEntrySelect = useCallback((entry: GridContextMenuEntry) => {
    entry.onSelect();
    setMenu(null);
  }, []);

  const pos = menu ? clampMenuPosition(menu.x, menu.y) : { left: 0, top: 0 };

  const portal =
    menu && entries.length > 0
      ? createPortal(
          <GridItemContextMenu
            menuRef={menuRef}
            left={pos.left}
            top={pos.top}
            entries={entries}
            onEntrySelect={handleEntrySelect}
          />,
          document.body,
        )
      : null;

  return {
    onContextMenu: entries.length > 0 ? onContextMenu : undefined,
    portal,
  };
}
