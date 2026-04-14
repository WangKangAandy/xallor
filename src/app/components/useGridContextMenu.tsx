import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
 * 通用右键菜单 hook：提供打开/关闭、点外部关闭、Portal 渲染。
 * 由调用方传入菜单 entries，以复用到图标右键菜单与空白区域右键菜单。
 */
export function useGridContextMenu(entries: GridContextMenuEntry[]) {
  const [menu, setMenu] = useState<MenuPos | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const hasEntries = entries.length > 0;

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!hasEntries) return;
      e.preventDefault();
      e.stopPropagation();
      setMenu({ x: e.clientX, y: e.clientY });
    },
    [hasEntries],
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

  const portal = useMemo(
    () =>
      menu && hasEntries
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
        : null,
    [menu, hasEntries, pos.left, pos.top, entries, handleEntrySelect],
  );

  return {
    onContextMenu: hasEntries ? onContextMenu : undefined,
    portal,
  };
}

