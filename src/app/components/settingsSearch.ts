export type SettingsSearchSectionId =
  | "account"
  | "general"
  | "appearance"
  | "wallpaper"
  | "widgets"
  | "privacy"
  | "about";

type SettingsSearchIndexEntry = {
  sectionId: SettingsSearchSectionId;
  titleTokens: string[];
  keywordTokens: string[];
};

const SETTINGS_SEARCH_INDEX: SettingsSearchIndexEntry[] = [
  {
    sectionId: "account",
    titleTokens: ["账户", "account"],
    keywordTokens: ["用户", "profile", "用户信息", "登录"],
  },
  {
    sectionId: "general",
    titleTokens: ["通用", "general"],
    keywordTokens: ["语言", "language", "搜索引擎", "engine", "侧边栏", "sidebar", "打开方式", "startup"],
  },
  {
    sectionId: "appearance",
    titleTokens: ["外观", "appearance"],
    keywordTokens: ["主题", "theme", "布局", "layout", "图标", "icon", "样式"],
  },
  {
    sectionId: "wallpaper",
    titleTokens: ["壁纸", "wallpaper"],
    keywordTokens: ["背景", "background"],
  },
  {
    sectionId: "widgets",
    titleTokens: ["站点", "组件", "widgets", "sites", "components"],
    keywordTokens: ["添加图标", "add icon", "快捷方式", "shortcuts"],
  },
  {
    sectionId: "privacy",
    titleTokens: ["隐私", "安全", "privacy", "security"],
    keywordTokens: ["隐私空间", "密码", "password", "隐藏", "hide"],
  },
  {
    sectionId: "about",
    titleTokens: ["关于", "about"],
    keywordTokens: ["版本", "version", "更新", "updated", "项目", "xallor"],
  },
];

export function normalizeSettingsSearchQuery(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

function scoreToken(token: string, query: string): number {
  if (token === query) return 40;
  if (token.startsWith(query)) return 25;
  if (token.includes(query)) return 10;
  return 0;
}

export function matchSettingsSection(query: string): SettingsSearchSectionId | null {
  const normalized = normalizeSettingsSearchQuery(query);
  if (!normalized) return null;

  let bestSection: SettingsSearchSectionId | null = null;
  let bestScore = 0;

  for (const entry of SETTINGS_SEARCH_INDEX) {
    let score = 0;

    for (const token of entry.titleTokens) {
      score = Math.max(score, scoreToken(token, normalized));
    }
    if (score > 0) {
      score += 20;
    } else {
      for (const token of entry.keywordTokens) {
        score = Math.max(score, scoreToken(token, normalized));
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestSection = entry.sectionId;
    }
  }

  return bestScore > 0 ? bestSection : null;
}
