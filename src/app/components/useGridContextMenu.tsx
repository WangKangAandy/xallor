import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GridContextMenuEntry } from "./gridItemContextMenuConfig";
import { GridItemContextMenu } from "./GridItemContextMenu";
import { useDismissOnPointerDownOutside } from "./useDismissOnPointerDownOutside";

type MenuPos = { anchorX: number; anchorY: number; left: number; top: number };

/** 与菜单 `w-max` 实际宽度同量级，用于视口边缘夹紧。 */
const MENU_MIN_WIDTH = 128;
const MENU_MIN_HEIGHT = 44;
const MENU_VIEWPORT_GAP = 8;

const EDITABLE_SELECTOR = [
  "input",
  "textarea",
  "[contenteditable='true']",
  "[data-context-native='true']",
  "[data-allow-native-context='true']",
].join(",");
const CONTEXT_DISABLED_SELECTOR = "[data-context-disabled='true']";

export function clampMenuPosition(
  x: number,
  y: number,
  menuWidth: number,
  menuHeight: number,
  vw = window.innerWidth,
  vh = window.innerHeight,
) {
  return {
    left: Math.max(MENU_VIEWPORT_GAP, Math.min(x, vw - menuWidth - MENU_VIEWPORT_GAP)),
    top: Math.max(MENU_VIEWPORT_GAP, Math.min(y, vh - menuHeight - MENU_VIEWPORT_GAP)),
  };
}

export function shouldBypassCustomContextMenu(target: HTMLElement | null): boolean {
  if (!target) return false;
  if (target.closest(CONTEXT_DISABLED_SELECTOR)) return true;
  if (target.closest(EDITABLE_SELECTOR)) return true;
  return false;
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
      if (shouldBypassCustomContextMenu(e.target as HTMLElement | null)) return;
      e.preventDefault();
      e.stopPropagation();
      const initial = clampMenuPosition(e.clientX, e.clientY, MENU_MIN_WIDTH, MENU_MIN_HEIGHT);
      setMenu({ anchorX: e.clientX, anchorY: e.clientY, left: initial.left, top: initial.top });
    },
    [hasEntries],
  );

  useDismissOnPointerDownOutside(menuRef, Boolean(menu), () => setMenu(null));
  useEffect(() => {
    if (!menu) return;
    const menuEl = menuRef.current;
    if (menuEl) {
      const rect = menuEl.getBoundingClientRect();
      const measured = clampMenuPosition(menu.anchorX, menu.anchorY, rect.width, rect.height);
      if (measured.left !== menu.left || measured.top !== menu.top) {
        setMenu((prev) =>
          prev
            ? {
                ...prev,
                left: measured.left,
                top: measured.top,
              }
            : prev,
        );
      }
    }
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const handleEntrySelect = useCallback((entry: GridContextMenuEntry) => {
    entry.onSelect();
    setMenu(null);
  }, []);

  const portal = useMemo(
    () =>
      menu && hasEntries
        ? createPortal(
            <GridItemContextMenu
              menuRef={menuRef}
              left={menu.left}
              top={menu.top}
              entries={entries}
              onEntrySelect={handleEntrySelect}
            />,
            document.body,
          )
        : null,
    [menu, hasEntries, entries, handleEntrySelect],
  );

  return {
    onContextMenu: hasEntries ? onContextMenu : undefined,
    portal,
  };
}

