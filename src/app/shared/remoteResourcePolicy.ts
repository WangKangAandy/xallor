export type RemoteResourceKind = "favicon" | "background" | "other";

export type RemoteCandidate = {
  id: string;
  url: string;
};

export type RemoteResourceMetricEvent = {
  kind: RemoteResourceKind;
  key: string;
  elapsedMs: number;
  outcome: "success" | "fallback";
  provider: string;
};

type RemoteResourceMetricStore = {
  events: RemoteResourceMetricEvent[];
};

type RemoteResourceMetricsApi = {
  read: () => RemoteResourceMetricEvent[];
  reset: () => void;
  summarize: (events?: RemoteResourceMetricEvent[]) => ReturnType<typeof summarizeRemoteResourceMetrics>;
};

const MEMORY_PREFIX = "remote-resource-memory:";

declare global {
  interface Window {
    __remoteResourceMetrics?: RemoteResourceMetricStore;
    __remoteResourceMetricsApi?: RemoteResourceMetricsApi;
  }
}

function getMetricStore(): RemoteResourceMetricStore | null {
  if (typeof window === "undefined") return null;
  if (!window.__remoteResourceMetrics) {
    window.__remoteResourceMetrics = { events: [] };
  }
  if (!window.__remoteResourceMetricsApi) {
    window.__remoteResourceMetricsApi = {
      read: () => readRemoteResourceMetrics(),
      reset: () => resetRemoteResourceMetrics(),
      summarize: (events?: RemoteResourceMetricEvent[]) => summarizeRemoteResourceMetrics(events ?? readRemoteResourceMetrics()),
    };
  }
  return window.__remoteResourceMetrics;
}

export function recordRemoteResourceMetric(event: RemoteResourceMetricEvent): void {
  const store = getMetricStore();
  if (!store) return;
  store.events.push(event);
}

export function readRemoteResourceMetrics(): RemoteResourceMetricEvent[] {
  const store = getMetricStore();
  if (!store) return [];
  return [...store.events];
}

export function resetRemoteResourceMetrics(): void {
  const store = getMetricStore();
  if (!store) return;
  store.events = [];
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  const idx = Math.max(0, Math.min(sorted.length - 1, rank));
  return sorted[idx] ?? 0;
}

export function summarizeRemoteResourceMetrics(events: RemoteResourceMetricEvent[]) {
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

function memoryKey(kind: RemoteResourceKind): string {
  return `${MEMORY_PREFIX}${kind}`;
}

type MemoryMap = Record<string, string>;

function readMemoryMap(kind: RemoteResourceKind): MemoryMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(memoryKey(kind));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as MemoryMap;
  } catch {
    return {};
  }
}

function writeMemoryMap(kind: RemoteResourceKind, map: MemoryMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(memoryKey(kind), JSON.stringify(map));
  } catch {
    // ignore quota/security exceptions in restrictive environments
  }
}

export function rememberSuccessfulCandidate(kind: RemoteResourceKind, key: string, candidateId: string): void {
  const map = readMemoryMap(kind);
  map[key] = candidateId;
  writeMemoryMap(kind, map);
}

export function readRememberedCandidate(kind: RemoteResourceKind, key: string): string | null {
  const map = readMemoryMap(kind);
  return map[key] ?? null;
}

export function orderCandidatesByMemory(
  kind: RemoteResourceKind,
  key: string,
  candidates: RemoteCandidate[],
): RemoteCandidate[] {
  const remembered = readRememberedCandidate(kind, key);
  if (!remembered) return candidates;
  const preferred = candidates.find((c) => c.id === remembered);
  if (!preferred) return candidates;
  return [preferred, ...candidates.filter((c) => c.id !== remembered)];
}

/** Favicon 多源竞速：单源超过该时间仍未成功则放弃该源，交给其他源（见 Phase F3）。 */
export const DEFAULT_FAVICON_REMOTE_CANDIDATE_TIMEOUT_MS = 700;

/** 背景图等大资源：单候选超时阈值（弱网长尾防挂死）。 */
export const DEFAULT_BACKGROUND_REMOTE_CANDIDATE_TIMEOUT_MS = 8000;

export type RaceRemoteCandidatesOptions = {
  /**
   * 每个候选若在指定毫秒内未完成 loader，则视为失败并让 `Promise.any` 尝试其余候选。
   * 不传或 ≤0 表示不启用单候选超时（与 F3 之前行为一致）。
   */
  perCandidateTimeoutMs?: number;
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = globalThis.setTimeout(() => {
      reject(new Error("remote candidate timeout"));
    }, ms);
    promise.then(
      (v) => {
        globalThis.clearTimeout(id);
        resolve(v);
      },
      (e: unknown) => {
        globalThis.clearTimeout(id);
        reject(e);
      },
    );
  });
}

export async function raceRemoteCandidates(
  candidates: RemoteCandidate[],
  loader: (candidate: RemoteCandidate) => Promise<void>,
  options?: RaceRemoteCandidatesOptions,
): Promise<RemoteCandidate | null> {
  const timeoutMs = options?.perCandidateTimeoutMs;
  const tasks = candidates.map((candidate) => {
    const settled = loader(candidate).then(() => ({
      candidate,
    }));
    if (timeoutMs == null || timeoutMs <= 0) {
      return settled;
    }
    return withTimeout(settled, timeoutMs);
  });
  try {
    const result = await Promise.any(tasks);
    return result.candidate;
  } catch {
    return null;
  }
}

