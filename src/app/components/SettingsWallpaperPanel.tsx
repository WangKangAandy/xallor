import { useEffect, useId, useMemo, useState, type MouseEvent } from "react";
import { Heart, Search, Sparkles, Upload } from "lucide-react";
import { useAppI18n } from "../i18n/AppI18n";
import type { MessageKey } from "../i18n/messages";
import type { PickLocalImageFailureReason } from "../localUpload/pickLocalImageAsDataUrl";
import { useUserLocalAssets } from "../localUpload";
import { LocalFileUploadButton } from "./localUpload/LocalFileUploadButton";

function mapPickFailureToMessageKey(reason: PickLocalImageFailureReason): MessageKey | null {
  switch (reason) {
    case "no_file":
      return null;
    case "too_large":
      return "localUpload.errorTooLarge";
    case "bad_type":
    case "empty":
      return "localUpload.errorBadType";
    case "read_failed":
      return "localUpload.errorReadFailed";
    case "stored_too_large":
      return "localUpload.errorStoredTooLarge";
    default:
      return "localUpload.errorReadFailed";
  }
}

type WallpaperKind = "static" | "dynamic";
type WallpaperCategoryFilter = "all" | "static" | "dynamic" | "favorites";

type MockWallpaperItem = {
  id: string;
  kind: WallpaperKind;
  gradientClass: string;
  titleKey: MessageKey;
  /** 演示「应用」时恢复内置默认背景（清除本地上传） */
  applyBehavior: "builtin_default" | "demo_only";
};

const MOCK_WALLPAPERS: MockWallpaperItem[] = [
  { id: "w1", kind: "static", gradientClass: "from-violet-600 via-fuchsia-600 to-cyan-400", titleKey: "settings.wallpaperSceneCity", applyBehavior: "builtin_default" },
  { id: "w2", kind: "dynamic", gradientClass: "from-sky-500 via-blue-700 to-slate-900", titleKey: "settings.wallpaperSceneOcean", applyBehavior: "demo_only" },
  { id: "w3", kind: "static", gradientClass: "from-emerald-700 via-teal-600 to-lime-300", titleKey: "settings.wallpaperSceneForest", applyBehavior: "demo_only" },
  { id: "w4", kind: "dynamic", gradientClass: "from-amber-500 via-orange-600 to-rose-700", titleKey: "settings.wallpaperSceneDesert", applyBehavior: "demo_only" },
  { id: "w5", kind: "static", gradientClass: "from-slate-600 via-slate-400 to-sky-200", titleKey: "settings.wallpaperSceneMist", applyBehavior: "demo_only" },
  { id: "w6", kind: "dynamic", gradientClass: "from-indigo-500 via-purple-600 to-pink-500", titleKey: "settings.wallpaperSceneDawn", applyBehavior: "demo_only" },
  { id: "w7", kind: "static", gradientClass: "from-cyan-600 via-blue-800 to-indigo-900", titleKey: "settings.wallpaperSceneOcean", applyBehavior: "demo_only" },
  { id: "w8", kind: "dynamic", gradientClass: "from-fuchsia-700 via-purple-800 to-slate-900", titleKey: "settings.wallpaperSceneCity", applyBehavior: "demo_only" },
  { id: "w9", kind: "static", gradientClass: "from-teal-800 via-emerald-700 to-green-300", titleKey: "settings.wallpaperSceneForest", applyBehavior: "demo_only" },
  { id: "w10", kind: "dynamic", gradientClass: "from-orange-400 via-red-500 to-violet-900", titleKey: "settings.wallpaperSceneDesert", applyBehavior: "demo_only" },
  { id: "w11", kind: "static", gradientClass: "from-zinc-700 via-stone-500 to-amber-100", titleKey: "settings.wallpaperSceneMist", applyBehavior: "demo_only" },
  { id: "w12", kind: "dynamic", gradientClass: "from-blue-400 via-cyan-300 to-emerald-600", titleKey: "settings.wallpaperSceneDawn", applyBehavior: "demo_only" },
];

type SettingsWallpaperPanelProps = {
  mainBodyClassName: string;
};

/**
 * 设置「壁纸」：双栏（图库 + 竖向预览），分类全部 / 静态 / 动态 / 我的收藏；云端接入前为占位数据。
 */
export function SettingsWallpaperPanel({ mainBodyClassName }: SettingsWallpaperPanelProps) {
  const { t } = useAppI18n();
  const searchId = useId();
  const { setWallpaperDataUrl } = useUserLocalAssets();
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<WallpaperCategoryFilter>("all");
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(() => new Set(["w1"]));
  const [selectedId, setSelectedId] = useState<string>("w1");

  const selected = useMemo(() => MOCK_WALLPAPERS.find((x) => x.id === selectedId) ?? MOCK_WALLPAPERS[0], [selectedId]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return MOCK_WALLPAPERS.filter((item) => {
      if (category === "favorites" && !favoritedIds.has(item.id)) return false;
      if (category === "static" && item.kind !== "static") return false;
      if (category === "dynamic" && item.kind !== "dynamic") return false;
      if (!q) return true;
      const title = t(item.titleKey).toLowerCase();
      return title.includes(q) || item.id.toLowerCase().includes(q);
    });
  }, [category, favoritedIds, searchQuery, t]);

  const filteredIdsKey = useMemo(() => filteredItems.map((i) => i.id).join(","), [filteredItems]);

  useEffect(() => {
    const ids = filteredIdsKey.split(",").filter(Boolean);
    if (!ids.length) return;
    if (!ids.includes(selectedId)) {
      setSelectedId(ids[0]!);
    }
  }, [filteredIdsKey, selectedId]);

  useEffect(() => {
    if (!uploadMessage && !statusMessage) return;
    const id = window.setTimeout(() => {
      setUploadMessage(null);
      setStatusMessage(null);
    }, 3800);
    return () => window.clearTimeout(id);
  }, [uploadMessage, statusMessage]);

  const toggleFavorite = (id: string, e?: MouseEvent) => {
    e?.stopPropagation();
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApply = () => {
    if (selected.applyBehavior === "builtin_default") {
      setWallpaperDataUrl(null);
      setStatusMessage(t("settings.wallpaperApplyBuiltinSuccess"));
      return;
    }
    setStatusMessage(t("settings.wallpaperApplyGradientHint"));
  };

  const filterButtons: Array<{ id: WallpaperCategoryFilter; labelKey: MessageKey; testId: string }> = [
    { id: "all", labelKey: "settings.wallpaperCategoryAll", testId: "settings-wallpaper-filter-all" },
    { id: "static", labelKey: "settings.wallpaperCategoryStatic", testId: "settings-wallpaper-filter-static" },
    { id: "dynamic", labelKey: "settings.wallpaperCategoryDynamic", testId: "settings-wallpaper-filter-dynamic" },
    { id: "favorites", labelKey: "settings.wallpaperCategoryFavorites", testId: "settings-wallpaper-filter-favorites" },
  ];

  return (
    <div
      className={`${mainBodyClassName} text-slate-800 dark:text-slate-100`}
      data-testid="settings-wallpaper-panel"
      role="region"
      aria-label={t("settings.wallpaper")}
    >
      <div className="flex min-h-0 min-w-0 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
        {/* 左：图库（搜索 + 分类 + 网格） */}
        <div className="min-w-0 flex-1 space-y-4">
          <div className="relative rounded-xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm dark:border-cyan-500/15 dark:bg-slate-950/55 dark:shadow-[0_0_24px_-8px_rgba(34,211,238,0.25)]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-cyan-500/70" aria-hidden />
            <input
              id={searchId}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("settings.wallpaperGallerySearchPlaceholder")}
              className="w-full rounded-xl border-0 bg-transparent py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 dark:text-slate-100 dark:placeholder:text-slate-500"
              aria-label={t("settings.wallpaperGallerySearchPlaceholder")}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
            <div className="flex min-w-0 flex-1 flex-wrap gap-2" role="tablist" aria-label={t("settings.wallpaperCategoryTabsAria")}>
              {filterButtons.map((btn) => {
                const active = category === btn.id;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    data-testid={btn.testId}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-cyan-500/70 bg-cyan-500/15 text-cyan-900 shadow-[0_0_12px_-2px_rgba(6,182,212,0.45)] dark:border-cyan-400/60 dark:bg-cyan-400/15 dark:text-cyan-50"
                        : "border-slate-200/90 bg-white/70 text-slate-600 hover:border-cyan-300/60 hover:bg-cyan-50/40 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-cyan-500/35 dark:hover:bg-slate-800/80"
                    }`}
                    onClick={() => setCategory(btn.id)}
                  >
                    {t(btn.labelKey)}
                  </button>
                );
              })}
            </div>
            <div className="flex w-full shrink-0 justify-end sm:w-auto sm:justify-start">
              <LocalFileUploadButton
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700"
                onPick={({ dataUrl }) => {
                  setUploadMessage(null);
                  setWallpaperDataUrl(dataUrl);
                  setStatusMessage(t("settings.wallpaperUploadApplied"));
                }}
                onPickError={(reason) => {
                  const key = mapPickFailureToMessageKey(reason);
                  setUploadMessage(key ? t(key) : null);
                }}
              >
                <Upload className="h-3.5 w-3.5" aria-hidden />
                {t("settings.wallpaperUploadLocalShort")}
              </LocalFileUploadButton>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300/80 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
              {t("settings.wallpaperFavoritesEmpty")}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label={t("settings.wallpaper")}>
              {filteredItems.map((item) => {
                const isSelected = item.id === selectedId;
                const fav = favoritedIds.has(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      data-testid={`settings-wallpaper-tile-${item.id}`}
                      onClick={() => setSelectedId(item.id)}
                      className={`group relative w-full overflow-hidden rounded-xl border text-left outline-none transition-all ${
                        isSelected
                          ? "border-cyan-400 ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-white dark:border-cyan-400 dark:ring-cyan-400/45 dark:ring-offset-slate-950"
                          : "border-slate-200/90 hover:border-cyan-400/40 dark:border-slate-600/80 dark:hover:border-cyan-500/40"
                      }`}
                    >
                      <div className={`aspect-[4/3] w-full bg-gradient-to-br ${item.gradientClass}`} />
                      <span className="absolute left-1.5 top-1.5 rounded bg-black/40 px-1 py-0.5 text-[9px] font-medium uppercase text-white/90">
                        {item.kind === "dynamic" ? t("settings.wallpaperKindDynamic") : t("settings.wallpaperKindStatic")}
                      </span>
                      <button
                        type="button"
                        aria-label={fav ? t("settings.wallpaperRemoveFavorite") : t("settings.wallpaperAddToFavorites")}
                        className="absolute right-1.5 top-1.5 rounded-full bg-black/45 p-1 text-white/90 backdrop-blur-sm transition hover:bg-black/60"
                        onClick={(e) => toggleFavorite(item.id, e)}
                      >
                        <Heart className={`h-3.5 w-3.5 ${fav ? "fill-rose-400 text-rose-400" : ""}`} />
                      </button>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {(uploadMessage || statusMessage) && (
            <div className="text-xs text-amber-800 dark:text-amber-200" role="status">
              {uploadMessage ?? statusMessage}
            </div>
          )}
        </div>

        {/* 右：竖向预览 + 主操作（深色霓虹强调） */}
        <aside
          className="flex w-full min-w-0 flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-lg backdrop-blur-md dark:border-cyan-500/20 dark:bg-slate-950/70 dark:shadow-[0_0_32px_-10px_rgba(34,211,238,0.35)] lg:grow-0 lg:shrink lg:basis-[min(280px,40%)] lg:max-w-[min(320px,44%)]"
          aria-label={t("settings.wallpaperPreviewPanelTitle")}
        >
          <div className="relative mx-auto w-full max-w-full min-w-0 overflow-hidden rounded-xl border border-slate-200/60 shadow-inner dark:border-cyan-500/20 sm:max-w-[240px]">
            <div className="aspect-[3/4] w-full bg-slate-200 dark:bg-slate-900">
              <div className={`h-full w-full bg-gradient-to-br ${selected.gradientClass}`} />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
          </div>
          <div className="mt-auto flex flex-col gap-2">
            <button
              type="button"
              data-testid="settings-wallpaper-apply"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110 active:scale-[0.99] dark:from-cyan-500 dark:via-blue-600 dark:to-fuchsia-600 dark:shadow-cyan-500/25"
              onClick={handleApply}
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              {t("settings.wallpaperApplyButton")}
            </button>
            <button
              type="button"
              data-testid="settings-wallpaper-favorite-toggle"
              className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                favoritedIds.has(selectedId)
                  ? "border-rose-400/50 bg-rose-500/10 text-rose-800 dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-100"
                  : "border-slate-200 bg-white/90 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
              onClick={() => toggleFavorite(selectedId)}
            >
              <Heart className={`h-4 w-4 ${favoritedIds.has(selectedId) ? "fill-current" : ""}`} aria-hidden />
              {favoritedIds.has(selectedId) ? t("settings.wallpaperInFavorites") : t("settings.wallpaperAddToFavorites")}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
