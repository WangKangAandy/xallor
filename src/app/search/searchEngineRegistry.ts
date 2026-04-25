import { siBaidu, siBrave, siDuckduckgo, siGoogle } from "simple-icons";

export type SearchEngine = {
  id: string;
  name: string;
  domain: string;
  searchUrl: string;
};

export type BuiltinSearchEngineIcon = {
  path: string;
  hex: string;
};

const SEARCH_ENGINES: SearchEngine[] = [
  { id: "baidu", name: "百度", domain: "baidu.com", searchUrl: "https://www.baidu.com/s?wd=" },
  { id: "google", name: "Google", domain: "google.com", searchUrl: "https://www.google.com/search?q=" },
  { id: "bing", name: "Bing", domain: "bing.com", searchUrl: "https://www.bing.com/search?q=" },
  { id: "duckduckgo", name: "DuckDuckGo", domain: "duckduckgo.com", searchUrl: "https://duckduckgo.com/?q=" },
  { id: "brave", name: "Brave", domain: "search.brave.com", searchUrl: "https://search.brave.com/search?q=" },
];

const BUILTIN_ENGINE_ICONS: Record<string, BuiltinSearchEngineIcon> = {
  baidu: { path: siBaidu.path, hex: siBaidu.hex },
  google: { path: siGoogle.path, hex: siGoogle.hex },
  duckduckgo: { path: siDuckduckgo.path, hex: siDuckduckgo.hex },
  brave: { path: siBrave.path, hex: siBrave.hex },
};

export function getAllSearchEngines(): SearchEngine[] {
  return SEARCH_ENGINES;
}

export function getSearchEngineById(id: string, engines: SearchEngine[] = SEARCH_ENGINES): SearchEngine | null {
  return engines.find((engine) => engine.id === id) ?? null;
}

export function resolveSearchEngineId(
  storedId: string | null | undefined,
  engines: SearchEngine[] = SEARCH_ENGINES,
): string {
  return engines.some((engine) => engine.id === storedId) ? (storedId as string) : "baidu";
}

const BUILTIN_ENGINE_DISPLAY_NAME: Record<string, { "zh-CN": string; "en-US": string }> = {
  baidu: { "zh-CN": "百度", "en-US": "Baidu" },
  google: { "zh-CN": "Google", "en-US": "Google" },
  bing: { "zh-CN": "Bing", "en-US": "Bing" },
  duckduckgo: { "zh-CN": "DuckDuckGo", "en-US": "DuckDuckGo" },
  brave: { "zh-CN": "Brave", "en-US": "Brave" },
};

/**
 * 内置引擎使用 locale 显示名；自定义引擎回退到 payload 中的 `name`。
 */
export function getSearchEngineDisplayName(engine: SearchEngine, locale: "zh-CN" | "en-US"): string {
  const names = BUILTIN_ENGINE_DISPLAY_NAME[engine.id];
  return names ? names[locale] : engine.name;
}

/**
 * 仅内置搜索引擎使用本地透明品牌 SVG；自定义引擎继续走 favicon 回退链路。
 */
export function getBuiltinSearchEngineIcon(id: string): BuiltinSearchEngineIcon | null {
  return BUILTIN_ENGINE_ICONS[id] ?? null;
}

