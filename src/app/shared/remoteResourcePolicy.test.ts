/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import {
  orderCandidatesByMemory,
  raceRemoteCandidates,
  rememberSuccessfulCandidate,
  type RemoteCandidate,
} from "./remoteResourcePolicy";

describe("remoteResourcePolicy memory ordering", () => {
  /**
   * 目的：成功源记忆应优先同 key 的历史成功候选，但不改变候选集合内容。
   */
  it("should_put_remembered_candidate_first_when_memory_exists", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockReturnValue(
      JSON.stringify({
        "github.com": "google-s2",
      }),
    );
    const candidates = [
      { id: "duckduckgo", url: "a" },
      { id: "google-s2", url: "b" },
      { id: "icon-horse", url: "c" },
    ];
    const ordered = orderCandidatesByMemory("favicon", "github.com", candidates);
    expect(ordered.map((c) => c.id)).toEqual(["google-s2", "duckduckgo", "icon-horse"]);
    getItem.mockRestore();
  });

  /**
   * 目的：成功记忆写入应落盘到 localStorage，供后续资源加载策略复用。
   */
  it("should_write_memory_map_when_remember_successful_candidate_called", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => undefined);
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockReturnValue("{}");
    rememberSuccessfulCandidate("favicon", "github.com", "icon-horse");
    expect(setItem).toHaveBeenCalled();
    getItem.mockRestore();
    setItem.mockRestore();
  });
});

describe("raceRemoteCandidates per-candidate timeout (F3)", () => {
  /**
   * 目的：单源慢于阈值时应视为失败，让其它候选有机会胜出，压缩长尾 p90。
   */
  it("should_pick_faster_loader_when_slower_exceeds_per_candidate_timeout", async () => {
    const candidates: RemoteCandidate[] = [
      { id: "slow", url: "s" },
      { id: "fast", url: "f" },
    ];
    const loader = async (c: RemoteCandidate) => {
      const delay = c.id === "slow" ? 200 : 50;
      await new Promise((r) => setTimeout(r, delay));
    };
    const result = await raceRemoteCandidates(candidates, loader, { perCandidateTimeoutMs: 80 });
    expect(result?.id).toBe("fast");
  }, 3000);

  /**
   * 目的：唯一候选若在超时内未完成，应整体失败，避免无限挂起。
   */
  it("should_return_null_when_only_candidate_times_out", async () => {
    const candidates: RemoteCandidate[] = [{ id: "only", url: "x" }];
    const loader = async () => {
      await new Promise((r) => setTimeout(r, 500));
    };
    const result = await raceRemoteCandidates(candidates, loader, { perCandidateTimeoutMs: 40 });
    expect(result).toBeNull();
  }, 3000);

  /**
   * 目的：未配置超时时保持旧行为（不因策略层引入额外 reject）。
   */
  it("should_resolve_without_extra_timeout_when_option_omitted", async () => {
    const candidates: RemoteCandidate[] = [{ id: "a", url: "a" }];
    const loader = async () => {
      await Promise.resolve();
    };
    const result = await raceRemoteCandidates(candidates, loader);
    expect(result?.id).toBe("a");
  });
});

