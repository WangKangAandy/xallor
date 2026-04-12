import type { ReactNode } from "react";
import { GlassSurface } from "../shared/GlassSurface";

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

const shellLayout =
  "flex min-h-[120px] w-full flex-col items-center justify-center gap-2 px-4 py-6 text-center text-sm text-white/80";

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
      <GlassSurface
        variant="placeholder"
        rounded="2xl"
        className={`${shellLayout} animate-pulse ${className}`}
        role="status"
        aria-busy="true"
      >
        <span>{loadingLabel}</span>
      </GlassSurface>
    );
  }

  if (phase === "error") {
    return (
      <GlassSurface variant="placeholder" rounded="2xl" className={`${shellLayout} ${className}`} role="alert">
        <span className="font-medium text-white/90">{errorTitle}</span>
        {errorHint ? <span className="text-xs text-white/60">{errorHint}</span> : null}
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="glass-placeholder-retry mt-1 rounded-lg px-3 py-1.5 text-xs text-white/90"
          >
            重试
          </button>
        ) : null}
      </GlassSurface>
    );
  }

  return <>{children}</>;
}
