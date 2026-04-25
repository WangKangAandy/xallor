import { describe, expect, it } from "vitest";
import { ADD_ICON_CATALOG } from "./addIconCatalog";
import { isLikelyUrlInput, resolveQuickSiteCandidate } from "./siteCandidateResolver";

describe("siteCandidateResolver", () => {
  /**
   * 目的：URL-like 输入识别用于触发“快速站点候选”链路，避免普通关键字误触发。
   */
  it("should_detect_url_like_input_when_query_contains_domain_or_protocol", () => {
    expect(isLikelyUrlInput("www.baidu.com")).toBe(true);
    expect(isLikelyUrlInput("https://openai.com")).toBe(true);
    expect(isLikelyUrlInput("github.com")).toBe(true);
    expect(isLikelyUrlInput("weather widget")).toBe(false);
  });

  /**
   * 目的：若输入域名命中目录站点，复用目录项而不是新建临时项。
   */
  it("should_reuse_catalog_site_when_domain_matches_existing_site", () => {
    const out = resolveQuickSiteCandidate("github.com", ADD_ICON_CATALOG);
    expect(out?.id).toBe("cat-site-github");
    expect(out?.name).toBe("GitHub");
  });

  /**
   * 目的：命中目录站点时仍应保留用户输入 URL，避免 `www.` 被目录默认值回写丢失。
   */
  it("should_preserve_input_url_when_domain_matches_catalog_site_with_www_prefix", () => {
    const out = resolveQuickSiteCandidate("https://www.youtube.com", ADD_ICON_CATALOG);
    expect(out?.id).toBe("cat-site-youtube");
    expect(out?.url).toBe("https://www.youtube.com");
  });

  /**
   * 目的：若输入不在目录中，创建可添加的临时站点候选并补全名称/URL。
   */
  it("should_create_quick_site_candidate_when_domain_not_in_catalog", () => {
    const out = resolveQuickSiteCandidate("www.baidu.com", ADD_ICON_CATALOG);
    expect(out?.id).toBe("quick-site-baidu.com");
    expect(out?.name).toBe("Baidu");
    expect(out?.domain).toBe("baidu.com");
    expect(out?.url).toBe("https://www.baidu.com");
  });
});

