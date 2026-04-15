import { describe, expect, it } from "vitest";
import { buildFaviconCandidates, summarizeFaviconMetrics } from "./FaviconIcon";

describe("buildFaviconCandidates", () => {
  /**
   * 目的：确保 favicon 多源回退链顺序稳定，避免单源变更导致回退策略失效。
   */
  it("should_return_favicon_candidates_in_expected_fallback_order", () => {
    const domain = "github.com";
    const result = buildFaviconCandidates(domain);

    expect(result).toEqual([
      { id: "duckduckgo", url: "https://icons.duckduckgo.com/ip3/github.com.ico" },
      { id: "google-s2", url: "https://www.google.com/s2/favicons?domain=github.com&sz=64" },
      { id: "icon-horse", url: "https://icon.horse/icon/github.com" },
    ]);
  });

  /**
   * 目的：输入域名存在前后空格时，候选 URL 仍应生成有效地址。
   */
  it("should_trim_domain_before_generating_favicon_candidate_urls", () => {
    const result = buildFaviconCandidates("  example.com  ");
    expect(result[0]?.url).toContain("example.com.ico");
    expect(result[2]?.url).toContain("example.com");
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

