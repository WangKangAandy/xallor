import type { ReactNode } from "react";

export type RemoteContentPhase = "loading" | "error" | "ready";

type RemoteContentPlaceholderProps = {
  phase: RemoteContentPhase;
  /** `phase === "ready"` 时渲染 */
  children?: ReactNode;
  loadingLabel?: string;
  errorTitle?: string;
  errorHint?: string;
  onRetry?: () => void;
  className?: string;
};

const shell =
  "flex min-h-[120px] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-6 text-center text-sm text-white/80 backdrop-blur-sm";

/**
 * 异步数据（未来 API、外链资源元数据等）的统一占位：加载中 / 失败 / 成功。
 * 业务组件根据请求结果切换 `phase`；仓库层只返回数据或错误语义，不渲染本组件。
 */
export function RemoteContentPlaceholder({
  phase,
  children,
  loadingLabel = "加载中…",
  errorTitle = "暂时无法加载",
  errorHint,
  onRetry,
  className = "",
}: RemoteContentPlaceholderProps) {
  if (phase === "loading") {
    return (
      <div className={`${shell} animate-pulse ${className}`} role="status" aria-busy="true">
        <span>{loadingLabel}</span>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className={`${shell} ${className}`} role="alert">
        <span className="font-medium text-white/90">{errorTitle}</span>
        {errorHint ? <span className="text-xs text-white/60">{errorHint}</span> : null}
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs text-white/90 hover:bg-white/20"
          >
            重试
          </button>
        ) : null}
      </div>
    );
  }

  return <>{children}</>;
}
