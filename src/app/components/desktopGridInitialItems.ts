import type { GridItemType } from "./desktopGridTypes";
import type { GridPayload } from "../storage/types";

export const DEFAULT_DESKTOP_GRID_ITEMS: GridItemType[] = [
  { id: "w1", type: "widget", widgetType: "weather", shape: { cols: 2, rows: 2 } },
  { id: "s1", type: "site", shape: { cols: 1, rows: 1 }, site: { name: "YouTube", domain: "youtube.com", url: "https://youtube.com" } },
  { id: "s2", type: "site", shape: { cols: 1, rows: 1 }, site: { name: "Gmail", domain: "gmail.com", url: "https://mail.google.com" } },
  {
    id: "f1",
    type: "folder",
    shape: { cols: 2, rows: 2 },
    name: "社交",
    colorFrom: "rgba(249,168,212,0.75)",
    colorTo: "rgba(251,113,133,0.75)",
    sites: [
      { name: "X / Twitter", domain: "twitter.com", url: "https://twitter.com" },
      { name: "Instagram", domain: "instagram.com", url: "https://instagram.com" },
      { name: "Discord", domain: "discord.com", url: "https://discord.com" },
      { name: "Telegram", domain: "telegram.org", url: "https://web.telegram.org" },
      { name: "TikTok", domain: "tiktok.com", url: "https://tiktok.com" },
      { name: "Reddit", domain: "reddit.com", url: "https://reddit.com" },
    ],
  },
  { id: "s3", type: "site", shape: { cols: 1, rows: 1 }, site: { name: "Spotify", domain: "open.spotify.com", url: "https://open.spotify.com" } },
  { id: "s4", type: "site", shape: { cols: 1, rows: 1 }, site: { name: "Notion", domain: "notion.so", url: "https://notion.so" } },
  { id: "s5", type: "site", shape: { cols: 1, rows: 1 }, site: { name: "GitHub", domain: "github.com", url: "https://github.com" } },
  {
    id: "f2",
    type: "folder",
    shape: { cols: 2, rows: 2 },
    name: "开发",
    colorFrom: "rgba(147,197,253,0.75)",
    colorTo: "rgba(99,102,241,0.75)",
    sites: [
      { name: "Figma", domain: "figma.com", url: "https://figma.com" },
      { name: "Vercel", domain: "vercel.com", url: "https://vercel.com" },
      { name: "Stack Overflow", domain: "stackoverflow.com", url: "https://stackoverflow.com" },
      { name: "MDN", domain: "developer.mozilla.org", url: "https://developer.mozilla.org" },
      { name: "Linear", domain: "linear.app", url: "https://linear.app" },
      { name: "CodePen", domain: "codepen.io", url: "https://codepen.io" },
    ],
  },
  { id: "s6", type: "site", shape: { cols: 1, rows: 1 }, site: { name: "Netflix", domain: "netflix.com", url: "https://netflix.com" } },
  {
    id: "f3",
    type: "folder",
    shape: { cols: 2, rows: 2 },
    name: "资讯",
    colorFrom: "rgba(252,211,77,0.75)",
    colorTo: "rgba(251,146,60,0.75)",
    sites: [
      { name: "Hacker News", domain: "news.ycombinator.com", url: "https://news.ycombinator.com" },
      { name: "Product Hunt", domain: "producthunt.com", url: "https://producthunt.com" },
      { name: "The Verge", domain: "theverge.com", url: "https://theverge.com" },
      { name: "Wired", domain: "wired.com", url: "https://wired.com" },
    ],
  },
  { id: "s7", type: "site", shape: { cols: 1, rows: 1 }, site: { name: "Slack", domain: "slack.com", url: "https://slack.com" } },
  { id: "s8", type: "site", shape: { cols: 1, rows: 1 }, site: { name: "Twitch", domain: "twitch.tv", url: "https://twitch.tv" } },
];

/** 首次加载 / 无持久化数据时的默认网格；模块级常量，供 `useGridPersistence` 稳定依赖。 */
export const DEFAULT_GRID_PAYLOAD: GridPayload = {
  items: DEFAULT_DESKTOP_GRID_ITEMS,
  showLabels: true,
};
