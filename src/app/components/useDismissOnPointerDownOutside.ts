import { useEffect } from "react";
import type { RefObject } from "react";

/**
 * 统一「点外部关闭」行为：
 * - 使用 pointerdown + capture，覆盖鼠标/触控/触控笔
 * - 避免被上层 preventDefault 吃掉传统 mousedown/click
 */
export function useDismissOnPointerDownOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  enabled: boolean,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (event: PointerEvent) => {
      if (ref.current?.contains(event.target as Node)) return;
      onDismiss();
    };
    document.addEventListener("pointerdown", handler, true);
    return () => {
      document.removeEventListener("pointerdown", handler, true);
    };
  }, [ref, enabled, onDismiss]);
}

