import { describe, expect, it } from "vitest";
import {
  normalizeSiteUrlInput,
  safeDomainFromUrl,
  toCustomIconFailureMessageKey,
} from "./addIconSubmitPayload";

describe("addIconSubmitPayload helpers", () => {
  /**
   * 目的：从用户输入的网址解析域名，供 favicon 与落盘 site.domain 一致。
   */
  it("should_return_hostname_without_www_when_safeDomainFromUrl_given_full_https_url", () => {
    expect(safeDomainFromUrl("https://www.youtube.com/watch?v=1", "x.com")).toBe("youtube.com");
  });

  /**
   * 目的：无协议时补全 https 再解析，避免相对输入导致解析失败。
   */
  it("should_normalize_scheme_when_normalizeSiteUrlInput_omits_protocol", () => {
    expect(normalizeSiteUrlInput("github.com", "https://fallback.dev")).toBe("https://github.com");
  });

  /**
   * 目的：对约定需要 `www.` 的站点（如 baidu），裸域名输入应默认补齐，避免历史回归。
   */
  it("should_prepend_www_when_normalizeSiteUrlInput_given_www_preferred_domain_without_protocol", () => {
    expect(normalizeSiteUrlInput("baidu.com", "https://fallback.dev")).toBe("https://www.baidu.com");
  });

  /**
   * 目的：本地图标上传失败时，错误文案应映射到统一 i18n key，避免分支漏提示。
   */
  it("should_map_failure_reason_to_message_key_when_custom_icon_upload_fails", () => {
    expect(toCustomIconFailureMessageKey("too_large")).toBe("localUpload.errorTooLarge");
    expect(toCustomIconFailureMessageKey("bad_type")).toBe("localUpload.errorBadType");
    expect(toCustomIconFailureMessageKey("read_failed")).toBe("localUpload.errorReadFailed");
    expect(toCustomIconFailureMessageKey("stored_too_large")).toBe("localUpload.errorStoredTooLarge");
    expect(toCustomIconFailureMessageKey("no_file")).toBeNull();
  });
});
