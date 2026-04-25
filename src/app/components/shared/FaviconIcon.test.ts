/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import {
  buildFaviconCandidates,
  markFaviconProviderFailureForTest,
  orderFaviconCandidates,
  resetFaviconProviderFailureScoresForTest,
  summarizeFaviconMetrics,
} from "./FaviconIcon";

describe("buildFaviconCandidates", () => {
  /**
   * 目的：确保 favicon 多源回退链顺序稳定，避免单源变更导致回退策略失效。
   */
  it("should_return_favicon_candidates_in_expected_fallback_order", () => {
    const domain = "github.com";
    const result = buildFaviconCandidates(domain);

    expect(result).toEqual([
      { id: "icon-horse", url: "https://icon.horse/icon/github.com" },
      { id: "duckduckgo", url: "https://icons.duckduckgo.com/ip3/github.com.ico" },
      { id: "google-s2", url: "https://www.google.com/s2/favicons?domain=github.com&sz=64" },
    ]);
  });

  /**
   * 目的：输入域名存在前后空格时，候选 URL 仍应生成有效地址。
   */
  it("should_trim_domain_before_generating_favicon_candidate_urls", () => {
    const result = buildFaviconCandidates("  example.com  ");
    expect(result[0]?.url).toContain("example.com");
    expect(result[1]?.url).toContain("example.com.ico");
  });

  /**
   * 目的：存在历史成功记忆时，首候选应与记忆一致，保证首帧 src 与竞速顺序统一。
   */
  it("should_put_remembered_candidate_first_when_ordering_favicon_candidates", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockReturnValue(
      JSON.stringify({
        "github.com": "google-s2",
      }),
    );
    resetFaviconProviderFailureScoresForTest();
    const result = orderFaviconCandidates("github.com");
    expect(result[0]?.id).toBe("google-s2");
    getItem.mockRestore();
  });

  /**
   * 目的：会话内失败次数高的源应被降级，减少连续命中不可达源。
   */
  it("should_deprioritize_provider_when_session_failure_score_is_higher", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockReturnValue("{}");
    resetFaviconProviderFailureScoresForTest();
    markFaviconProviderFailureForTest("icon-horse");
    markFaviconProviderFailureForTest("icon-horse");
    const result = orderFaviconCandidates("github.com");
    expect(result[0]?.id).toBe("duckduckgo");
    expect(result[2]?.id).toBe("icon-horse");
    getItem.mockRestore();
    resetFaviconProviderFailureScoresForTest();
  });
});

describe("summarizeFaviconMetrics", () => {
  /**
   * 目的：为优化前后对比提供稳定统计口径（p50/p90/fallback/provider）。
   */
  it("should_compute_metric_summary_when_events_provided", () => {
    const summary = summarizeFaviconMetrics([
      { domain: "a.com", elapsedMs: 100, outcome: "success", provider: "icons.duckduckgo.com" },
      { domain: "b.com", elapsedMs: 220, outcome: "fallback", provider: "fallback-initial" },
      { domain: "c.com", elapsedMs: 140, outcome: "success", provider: "www.google.com" },
      { domain: "d.com", elapsedMs: 180, outcome: "success", provider: "icons.duckduckgo.com" },
    ]);

    expect(summary.total).toBe(4);
    expect(summary.successCount).toBe(3);
    expect(summary.fallbackCount).toBe(1);
    expect(summary.fallbackRate).toBe(0.25);
    expect(summary.p50).toBe(140);
    expect(summary.p90).toBe(220);
    expect(summary.providerDistribution["icons.duckduckgo.com"]).toBe(2);
  });
});

