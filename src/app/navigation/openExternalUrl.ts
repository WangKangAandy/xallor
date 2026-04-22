export type OpenExternalUrlOptions = {
  /** true = 新标签；false = 当前标签 */
  openInNewTab: boolean;
};

/**
 * 无状态底层：仅分支 window.open / location.assign；不读偏好与 React。
 * 须在用户手势同步链内调用，避免 window.open 被拦截。
 */
export function openExternalUrlImpl(url: string, options: OpenExternalUrlOptions): void {
  if (options.openInNewTab) {
    globalThis.window.open(url, "_blank", "noopener,noreferrer");
  } else {
    globalThis.location.assign(url);
  }
}
