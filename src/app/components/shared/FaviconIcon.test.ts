import { describe, expect, it } from "vitest";
import { buildFaviconCandidates } from "./FaviconIcon";

describe("buildFaviconCandidates", () => {
  /**
   * 目的：确保 favicon 多源回退链顺序稳定，避免单源变更导致回退策略失效。
   */
  it("should_return_favicon_candidates_in_expected_fallback_order", () => {
    const domain = "github.com";
    const result = buildFaviconCandidates(domain);

    expect(result).toEqual([
      "https://icons.duckduckgo.com/ip3/github.com.ico",
      "https://www.google.com/s2/favicons?domain=github.com&sz=64",
      "https://icon.horse/icon/github.com",
    ]);
  });

  /**
   * 目的：输入域名存在前后空格时，候选 URL 仍应生成有效地址。
   */
  it("should_trim_domain_before_generating_favicon_candidate_urls", () => {
    const result = buildFaviconCandidates("  example.com  ");
    expect(result[0]).toContain("example.com.ico");
    expect(result[2]).toContain("example.com");
  });
});

