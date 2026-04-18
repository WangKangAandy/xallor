import { useCallback, useMemo, useState } from "react";
import type { LayoutMode } from "./layoutTypes";

export const UI_LAYOUT_STORAGE_KEY = "xallor_ui_layout";

/** 供单测与存储迁移；非法值一律回退 default。 */
export function parseStoredLayoutMode(raw: string | null): LayoutMode {
  if (raw === "minimal") return "minimal";
  return "default";
}

function readInitialLayoutMode(): LayoutMode {
  return parseStoredLayoutMode(globalThis.localStorage?.getItem(UI_LAYOUT_STORAGE_KEY) ?? null);
}

/**
 * UI 偏好单入口（首版仅 layoutMode）。业务组件勿直接读写 `UI_LAYOUT_STORAGE_KEY`。
 * 持久化仅在用户调用 `setLayoutMode` 时写入，避免 useEffect 与外部写入 localStorage 竞态（如 E2E、迁移脚本）。
 */
export function useUiPreferences() {
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>(() => readInitialLayoutMode());

  const setLayoutMode = useCallback((mode: LayoutMode) => {
    setLayoutModeState(mode);
    globalThis.localStorage?.setItem(UI_LAYOUT_STORAGE_KEY, mode);
  }, []);

  return useMemo(
    () => ({
      layoutMode,
      setLayoutMode,
    }),
    [layoutMode, setLayoutMode],
  );
}
