import type { RemoteCandidate } from "../../shared/remoteResourcePolicy";

/** 默认新标签页背景（内置资源）；失败时由 `RemoteBackgroundImage` 切换为本地渐变，不依赖存储层。 */
export const DEFAULT_NEW_TAB_BACKGROUND_URL =
  "/wallpapers/wallhaven-219xmg_3840x3072.png";

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
