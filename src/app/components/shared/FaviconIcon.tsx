import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_FAVICON_REMOTE_CANDIDATE_TIMEOUT_MS,
  orderCandidatesByMemory,
  raceRemoteCandidates,
  readRemoteResourceMetrics,
  recordRemoteResourceMetric,
  rememberSuccessfulCandidate,
  resetRemoteResourceMetrics,
  type RemoteCandidate,
  type RemoteResourceMetricEvent,
} from "../../shared/remoteResourcePolicy";

const faviconProviderFailureScores = new Map<string, number>();

export function buildFaviconCandidates(domain: string): RemoteCandidate[] {
  const safeDomain = domain.trim();
  return [
    { id: "icon-horse", url: `https://icon.horse/icon/${safeDomain}` },
    { id: "duckduckgo", url: `https://icons.duckduckgo.com/ip3/${safeDomain}.ico` },
    { id: "google-s2", url: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(safeDomain)}&sz=64` },
  ];
}

function getProviderFailureScore(providerId: string): number {
  return faviconProviderFailureScores.get(providerId) ?? 0;
}

function markProviderFailure(providerId: string): void {
  const score = getProviderFailureScore(providerId);
  faviconProviderFailureScores.set(providerId, score + 1);
}

function markProviderSuccess(providerId: string): void {
  if (!faviconProviderFailureScores.has(providerId)) return;
  faviconProviderFailureScores.delete(providerId);
}

export function resetFaviconProviderFailureScoresForTest(): void {
  faviconProviderFailureScores.clear();
}

export function markFaviconProviderFailureForTest(providerId: string): void {
  markProviderFailure(providerId);
}

/**
 * 排序规则：
 * 1) 默认候选顺序（国内优先）；
 * 2) 历史成功记忆优先；
 * 3) 会话内失败次数越多，优先级越低。
 */
export function orderFaviconCandidates(domain: string): RemoteCandidate[] {
  const defaults = buildFaviconCandidates(domain);
  const byMemory = orderCandidatesByMemory("favicon", domain, defaults);
  return [...byMemory].sort((a, b) => getProviderFailureScore(a.id) - getProviderFailureScore(b.id));
}

function preloadFavicon(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`favicon load failed: ${src}`));
    img.src = src;
  });
}

export type FaviconMetricEvent = {
  domain: string;
  elapsedMs: number;
  outcome: "success" | "fallback";
  provider: string;
};

type FaviconMetricsApi = {
  read: () => FaviconMetricEvent[];
  reset: () => void;
  summarize: (events?: FaviconMetricEvent[]) => ReturnType<typeof summarizeFaviconMetrics>;
};

declare global {
  interface Window {
    __faviconMetricsApi?: FaviconMetricsApi;
  }
}

function nowMs(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function mapRemoteEventsToFavicon(events: RemoteResourceMetricEvent[]): FaviconMetricEvent[] {
  return events
    .filter((event) => event.kind === "favicon")
    .map((event) => ({
      domain: event.key,
      elapsedMs: event.elapsedMs,
      outcome: event.outcome,
      provider: event.provider,
    }));
}

function ensureFaviconMetricsApi(): void {
  if (typeof window === "undefined") return;
  if (!window.__faviconMetricsApi) {
    window.__faviconMetricsApi = {
      read: () => readFaviconMetrics(),
      reset: () => resetFaviconMetrics(),
      summarize: (events?: FaviconMetricEvent[]) => summarizeFaviconMetrics(events ?? readFaviconMetrics()),
    };
  }
}

export function recordFaviconMetric(event: FaviconMetricEvent): void {
  recordRemoteResourceMetric({
    kind: "favicon",
    key: event.domain,
    elapsedMs: event.elapsedMs,
    outcome: event.outcome,
    provider: event.provider,
  });
}

export function resetFaviconMetrics(): void {
  const rest = readRemoteResourceMetrics().filter((event) => event.kind !== "favicon");
  resetRemoteResourceMetrics();
  rest.forEach((event) => recordRemoteResourceMetric(event));
}

export function readFaviconMetrics(): FaviconMetricEvent[] {
  return mapRemoteEventsToFavicon(readRemoteResourceMetrics());
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  const idx = Math.max(0, Math.min(sorted.length - 1, rank));
  return sorted[idx] ?? 0;
}

export function summarizeFaviconMetrics(events: FaviconMetricEvent[]) {
  const elapsed = events.map((e) => e.elapsedMs).sort((a, b) => a - b);
  const successCount = events.filter((e) => e.outcome === "success").length;
  const fallbackCount = events.filter((e) => e.outcome === "fallback").length;
  const providerDistribution = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.provider] = (acc[event.provider] ?? 0) + 1;
    return acc;
  }, {});
  return {
    total: events.length,
    successCount,
    fallbackCount,
    fallbackRate: events.length > 0 ? fallbackCount / events.length : 0,
    p50: percentile(elapsed, 50),
    p90: percentile(elapsed, 90),
    providerDistribution,
  };
}

interface FaviconIconProps {
  domain: string;
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  fallbackClassName?: string;
}

export function FaviconIcon({
  domain,
  name,
  size = 20,
  className = "",
  style,
  fallbackClassName = "",
}: FaviconIconProps) {
  ensureFaviconMetricsApi();
  const candidates = useMemo(() => orderFaviconCandidates(domain), [domain]);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const startAtRef = useRef(nowMs());
  const reportedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setResolvedSrc(null);
    setIsFallback(false);
    startAtRef.current = nowMs();
    reportedRef.current = false;
    raceRemoteCandidates(candidates, (candidate) => preloadFavicon(candidate.url), {
      perCandidateTimeoutMs: DEFAULT_FAVICON_REMOTE_CANDIDATE_TIMEOUT_MS,
      onCandidateFailure: (candidate) => {
        markProviderFailure(candidate.id);
      },
    })
      .then((winner) => {
        if (cancelled) return;
        if (winner) {
          setResolvedSrc(winner.url);
          rememberSuccessfulCandidate("favicon", domain, winner.id);
          markProviderSuccess(winner.id);
        } else {
          setIsFallback(true);
        }
        if (!reportedRef.current && winner) {
          reportedRef.current = true;
          recordFaviconMetric({
            domain,
            elapsedMs: nowMs() - startAtRef.current,
            outcome: "success",
            provider: winner.id,
          });
        }
        if (!reportedRef.current && !winner) {
          reportedRef.current = true;
          recordFaviconMetric({
            domain,
            elapsedMs: nowMs() - startAtRef.current,
            outcome: "fallback",
            provider: "fallback-initial",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [candidates, domain]);

  useEffect(() => {
    if (!isFallback) return;
    if (reportedRef.current) return;
    // defensive fallback metric in case effect flow changes
    reportedRef.current = true;
    recordFaviconMetric({
      domain,
      elapsedMs: nowMs() - startAtRef.current,
      outcome: "fallback",
      provider: "fallback-initial",
    });
  }, [domain, isFallback]);

  if (isFallback) {
    return (
      <div
        className={`flex items-center justify-center font-bold text-gray-700 shadow-sm glass-favicon-fallback ${fallbackClassName}`}
        style={{ width: size, height: size, borderRadius: size * 0.25, fontSize: size * 0.45, ...style }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc ?? candidates[0]?.url ?? ""}
      alt={name}
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: size * 0.2, ...style }}
      draggable={false}
    />
  );
}

