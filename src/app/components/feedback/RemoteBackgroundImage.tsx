import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_BACKGROUND_REMOTE_CANDIDATE_TIMEOUT_MS,
  orderCandidatesByMemory,
  raceRemoteCandidates,
  recordRemoteResourceMetric,
  rememberSuccessfulCandidate,
} from "../../shared/remoteResourcePolicy";
import { buildBackgroundCandidates } from "./remoteBackground";

type RemoteBackgroundImageProps = {
  src: string;
  /** 图片无法加载时的全屏兜底（与主视觉协调的渐变，不发起网络请求） */
  fallbackClassName?: string;
};

function preloadBackgroundImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`background image load failed: ${url}`));
    img.src = url;
  });
}

function nowMs(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

/**
 * 全屏外链背景图：通过 `remoteResourcePolicy` 多候选竞速 + 单候选超时，弱网下避免长时间挂死；
 * 加载失败或全部候选超时则降级为纯 CSS 渐变。
 */
export function RemoteBackgroundImage({
  src,
  fallbackClassName = "absolute inset-0 bg-gradient-to-b from-slate-900 via-sky-950 to-blue-950",
}: RemoteBackgroundImageProps) {
  const memoryKey = useMemo(() => src.trim(), [src]);
  const candidates = useMemo(() => buildBackgroundCandidates(src), [src]);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const startAtRef = useRef(nowMs());

  useEffect(() => {
    let cancelled = false;
    setResolvedSrc(null);
    setFailed(false);
    startAtRef.current = nowMs();
    const ordered = orderCandidatesByMemory("background", memoryKey, candidates);

    raceRemoteCandidates(ordered, (candidate) => preloadBackgroundImage(candidate.url), {
      perCandidateTimeoutMs: DEFAULT_BACKGROUND_REMOTE_CANDIDATE_TIMEOUT_MS,
    }).then((winner) => {
      if (cancelled) return;
      if (winner) {
        setResolvedSrc(winner.url);
        rememberSuccessfulCandidate("background", memoryKey, winner.id);
        recordRemoteResourceMetric({
          kind: "background",
          key: memoryKey,
          elapsedMs: nowMs() - startAtRef.current,
          outcome: "success",
          provider: winner.id,
        });
      } else {
        setFailed(true);
        recordRemoteResourceMetric({
          kind: "background",
          key: memoryKey,
          elapsedMs: nowMs() - startAtRef.current,
          outcome: "fallback",
          provider: "gradient-fallback",
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [candidates, memoryKey]);

  if (failed) {
    return <div className={fallbackClassName} aria-hidden />;
  }

  if (!resolvedSrc) {
    return <div className={fallbackClassName} aria-hidden />;
  }

  return (
    <img
      src={resolvedSrc}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
      onError={() => setFailed(true)}
      decoding="async"
      fetchPriority="low"
    />
  );
}
