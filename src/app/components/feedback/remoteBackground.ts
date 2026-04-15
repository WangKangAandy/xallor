import type { RemoteCandidate } from "../../shared/remoteResourcePolicy";

/** 默认新标签页背景（外链）；失败时由 `RemoteBackgroundImage` 切换为本地渐变，不依赖存储层。 */
export const DEFAULT_NEW_TAB_BACKGROUND_URL =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5ueSUyMGJlYWNoJTIwaXNsYW5kJTIwY2xlYXIlMjBza3l8ZW58MHx8fHwxNjk2NTQ3OTM3fDA&ixlib=rb-4.1.0&q=80&w=1920";

/**
 * 为竞速准备多分辨率候选：在 URL 含 `w=` 时增加较小宽度版本，弱网下更易先完成加载。
 */
export function buildBackgroundCandidates(src: string): RemoteCandidate[] {
  const trimmed = src.trim();
  const alt = trimmed.replace(/([?&])w=\d+/i, "$1w=1280");
  if (alt !== trimmed) {
    return [
      { id: "primary", url: trimmed },
      { id: "fallback-smaller", url: alt },
    ];
  }
  return [{ id: "primary", url: trimmed }];
}
