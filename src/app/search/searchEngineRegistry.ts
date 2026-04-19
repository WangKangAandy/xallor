export type SearchEngine = {
  id: string;
  name: string;
  domain: string;
  searchUrl: string;
};

const SEARCH_ENGINES: SearchEngine[] = [
  { id: "baidu", name: "百度", domain: "baidu.com", searchUrl: "https://www.baidu.com/s?wd=" },
  { id: "google", name: "Google", domain: "google.com", searchUrl: "https://www.google.com/search?q=" },
  { id: "bing", name: "Bing", domain: "bing.com", searchUrl: "https://www.bing.com/search?q=" },
  { id: "duckduckgo", name: "DuckDuckGo", domain: "duckduckgo.com", searchUrl: "https://duckduckgo.com/?q=" },
  { id: "brave", name: "Brave", domain: "search.brave.com", searchUrl: "https://search.brave.com/search?q=" },
];

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

