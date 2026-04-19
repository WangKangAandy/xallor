import { useCallback } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { useUiPreferences } from "../preferences";
import { openExternalUrlImpl } from "./openExternalUrl";

export type OpenExternalUrlModifierEvent = MouseEvent | KeyboardEvent | undefined;

function shouldForceNewTabFromEvent(event: OpenExternalUrlModifierEvent): boolean {
  if (!event) return false;
  if (event.metaKey || event.ctrlKey) return true;
  if ("button" in event && event.button === 1) return true;
  return false;
}

/**
 * 业务打开外链的唯一入口：注入 `openLinksInNewTab`，并处理 Ctrl/Cmd/中键强制新标签。
 */
export function useOpenExternalUrl() {
  const { openLinksInNewTab } = useUiPreferences();

  return useCallback(
    (url: string, event?: OpenExternalUrlModifierEvent) => {
      const forceNew = shouldForceNewTabFromEvent(event);
      openExternalUrlImpl(url, { openInNewTab: forceNew || openLinksInNewTab });
    },
    [openLinksInNewTab],
  );
}
