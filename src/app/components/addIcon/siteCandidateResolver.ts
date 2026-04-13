import type { AddIconCatalogEntry, AddIconCatalogSite } from "./addIconCatalog";
import { normalizeSiteUrlInput, safeDomainFromUrl } from "./addIconSubmitPayload";

const KNOWN_SITE_NAMES: Record<string, string> = {
  "github.com": "GitHub",
  "youtube.com": "YouTube",
  "google.com": "Google",
  "baidu.com": "Baidu",
  "bilibili.com": "哔哩哔哩",
  "notion.so": "Notion",
  "x.com": "X",
};

export function isLikelyUrlInput(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  return /^https?:\/\//i.test(t) || /^www\./i.test(t) || /^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(t);
}

function inferSiteNameFromDomain(domain: string): string {
  const known = KNOWN_SITE_NAMES[domain.toLowerCase()];
  if (known) return known;
  const first = domain.split(".")[0] ?? domain;
  const normalized = first.replace(/[-_]+/g, " ").trim();
  if (!normalized) return domain;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * 将搜索框中的 URL-like 输入解析为可直接添加的站点候选。
 * 若命中内置目录同域名站点，则复用目录项；否则生成临时候选项。
 */
export function resolveQuickSiteCandidate(raw: string, catalog: AddIconCatalogEntry[]): AddIconCatalogSite | null {
  if (!isLikelyUrlInput(raw)) return null;
  const normalizedUrl = normalizeSiteUrlInput(raw, raw);
  const domain = safeDomainFromUrl(normalizedUrl, "");
  if (!domain) return null;

  const existing = catalog.find((entry) => entry.kind === "site" && entry.domain.toLowerCase() === domain.toLowerCase());
  if (existing && existing.kind === "site") {
    return existing;
  }

  return {
    kind: "site",
    id: `quick-site-${domain.toLowerCase()}`,
    name: inferSiteNameFromDomain(domain),
    domain,
    url: normalizedUrl,
  };
}

