import { describe, expect, it } from "vitest";
import { buildBackgroundCandidates } from "./remoteBackground";

describe("buildBackgroundCandidates", () => {
  /**
   * 目的：在 URL 含宽度参数时生成较小版本候选，供竞速优先完成弱网首屏。
   */
  it("should_add_smaller_width_variant_when_w_query_present", () => {
    const src = "https://example.com/img?q=1&w=1920";
    const c = buildBackgroundCandidates(src);
    expect(c).toHaveLength(2);
    expect(c[1]?.id).toBe("fallback-smaller");
    expect(c[1]?.url).toContain("w=1280");
  });

  /**
   * 目的：无 `w=` 时保持单候选，避免错误改写 URL。
   */
  it("should_return_single_candidate_when_no_w_param", () => {
    const src = "https://example.com/img?q=1";
    expect(buildBackgroundCandidates(src)).toHaveLength(1);
  });
});
