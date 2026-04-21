import {
  Activity,
  ArrowRight,
  FileText,
  Bell,
  Boxes,
  Globe,
  Image,
  ShieldCheck,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DEFAULT_NEW_TAB_BACKGROUND_URL } from "./feedback";
import { useAppI18n, type AppLocale } from "../i18n/AppI18n";
import type { LayoutMode } from "../preferences";
import { useUiPreferences } from "../preferences";
import { SegmentedControl } from "./shared/SegmentedControl";
import {
  getAllSearchEngines,
  getSearchEngineDisplayName,
  getSearchEngineById,
  resolveSearchEngineId,
  type SearchEngine,
} from "../search/searchEngineRegistry";
import type { SiteItem } from "./desktopGridTypes";
import { Favicon } from "./DesktopGridItemPrimitives";
import { GlassMessageDialog } from "./shared/GlassMessageDialog";
import { useOpenExternalUrl } from "../navigation";
import { loadSearchPayload } from "../storage/repository";
import { useDismissOnPointerDownOutside } from "./useDismissOnPointerDownOutside";
import aboutContent from "../config/about-content.json";

type SettingsSpotlightModalProps = {
  open: boolean;
  onClose: () => void;
  /** 打开时默认定位分区；未传则回到通用。 */
  initialSection?: SettingsSectionId;
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
  openLinksInNewTab: boolean;
  onOpenLinksInNewTabChange: (value: boolean) => void;
  hiddenSpaceEnabled: boolean;
  hiddenItems: SiteItem[];
  onEnableHiddenSpace: (password: string) => Promise<void>;
  onDisableHiddenSpace: (password: string) => Promise<boolean>;
  onVerifyHiddenPassword: (password: string) => Promise<boolean>;
  onRemoveHiddenItems: (ids: string[]) => void;
  onRestoreHiddenItems: (items: SiteItem[]) => void;
  isMinimalMode: boolean;
  folderHintResetVisible?: boolean;
  onResetFolderHint?: () => void;
};

const SECTIONS = [
  { id: "account", labelKey: "settings.account", Icon: UserRound },
  { id: "general", labelKey: "settings.general", Icon: SlidersHorizontal },
  { id: "appearance", labelKey: "settings.appearance", Icon: Sparkles },
  { id: "wallpaper", labelKey: "settings.wallpaper", Icon: Image },
  { id: "widgets", labelKey: "settings.widgets", Icon: Boxes },
  { id: "privacy", labelKey: "settings.privacySecurity", Icon: Shield },
  { id: "about", labelKey: "settings.about", Icon: Globe },
] as const;

type SettingsSectionId = (typeof SECTIONS)[number]["id"];

const TOGGLES = [
  {
    titleKey: "settings.showWeather",
    descKey: "settings.showWeatherDesc",
    enabled: true,
  },
  {
    titleKey: "settings.showShortcutSuggestions",
    descKey: "settings.showShortcutSuggestionsDesc",
    enabled: true,
  },
  {
    titleKey: "settings.showRecentlyVisited",
    descKey: "settings.showRecentlyVisitedDesc",
    enabled: false,
  },
] as const;

/** 设置右侧主内容区统一容器样式：集中维护间距与文本色。 */
const SETTINGS_MAIN_BODY_CLASS = "min-w-0 max-w-full space-y-6 px-6 pb-6 pt-4 text-slate-800 dark:text-slate-100";

function SettingsToggleRow({
  title,
  description,
  pressed,
  onPressedChange,
  testId,
}: {
  title: string;
  description?: string;
  pressed: boolean;
  onPressedChange: (next: boolean) => void;
  testId?: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 py-2">
      <div className="min-w-0 pr-2">
        <div className="text-sm text-slate-900 dark:text-slate-100">{title}</div>
        {description ? (
          <div className="break-words text-xs text-slate-500 dark:text-slate-400">{description}</div>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={pressed}
        data-testid={testId}
        className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors ${
          pressed ? "bg-sky-500/90" : "bg-slate-300"
        }`}
        onClick={() => onPressedChange(!pressed)}
      >
        <span
          className={`pointer-events-none h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            pressed ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function SettingsRangeRow({
  label,
  valueLabel,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  valueLabel: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
        <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{valueLabel}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200/90 accent-sky-500 dark:bg-slate-600/80"
      />
    </div>
  );
}

/** 外观页：主题与布局走 `UiPreferences`；其余控件仍为本地示意，可后续接入 preferences。 */
function SettingsAppearancePanel({
  layoutMode,
  onLayoutModeChange,
}: {
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
}) {
  const { t } = useAppI18n();
  const { colorScheme, setColorScheme, gridItemNamesVisible, setGridItemNamesVisible } = useUiPreferences();
  const [gridColumns, setGridColumns] = useState(6);
  const [gridRows, setGridRows] = useState(2);
  const [iconSize, setIconSize] = useState<"small" | "medium" | "large">("medium");
  const [iconGap, setIconGap] = useState(16);
  const [minimalShowSearchBar, setMinimalShowSearchBar] = useState(true);
  const [minimalShowQuickActions, setMinimalShowQuickActions] = useState(true);
  const [minimalContentWidth, setMinimalContentWidth] = useState<"narrow" | "standard" | "wide">("standard");

  return (
    <div className={SETTINGS_MAIN_BODY_CLASS}>
      <div className="min-w-0 space-y-4 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/72 p-4 dark:border-slate-600/60 dark:bg-slate-800/75">
        <div className="min-w-0">
          <div className="text-sm font-medium">{t("settings.appearanceTheme")}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("settings.appearanceThemeHint")}</div>
        </div>
        <SegmentedControl<"light" | "dark" | "system">
          value={colorScheme}
          onChange={setColorScheme}
          ariaLabel={t("settings.appearanceTheme")}
          options={[
            { value: "light", label: t("settings.appearanceThemeLight"), testId: "settings-appearance-theme-light" },
            { value: "dark", label: t("settings.appearanceThemeDark"), testId: "settings-appearance-theme-dark" },
            { value: "system", label: t("settings.appearanceThemeSystem"), testId: "settings-appearance-theme-system" },
          ]}
        />
      </div>

      <div className="min-w-0 space-y-4 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/72 p-4 dark:border-slate-600/60 dark:bg-slate-800/75">
        <div className="min-w-0">
          <div className="text-sm font-medium">{t("settings.appearanceWallpaper")}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("settings.appearanceWallpaperHint")}</div>
        </div>
        <div className="relative mx-auto aspect-[5/2] w-full max-w-[280px] overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100/50 shadow-inner dark:border-slate-600/60 dark:bg-slate-900/50">
          <img
            src={DEFAULT_NEW_TAB_BACKGROUND_URL}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            width={280}
            height={112}
            draggable={false}
          />
        </div>
        <button
          type="button"
          className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-white dark:border-slate-600 dark:bg-slate-700/90 dark:text-slate-100 dark:hover:bg-slate-600/90"
        >
          {t("settings.appearancePickWallpaper")}
        </button>
      </div>

      <div className="min-w-0 space-y-4 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/72 p-4 dark:border-slate-600/60 dark:bg-slate-800/75">
        <div className="min-w-0">
          <div className="text-base font-semibold">{t("settings.layoutConfigTitle")}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("settings.layoutConfigDesc")}</div>
        </div>
        <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-600/70 dark:bg-slate-700/35">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div>
              <div className="text-sm font-medium">{t("settings.layoutMode")}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("settings.layoutModeDesc")}</div>
            </div>
            <SegmentedControl<LayoutMode>
              value={layoutMode}
              onChange={onLayoutModeChange}
              options={[
                {
                  value: "default",
                  label: t("settings.layoutOptionDefault"),
                  testId: "settings-layout-mode-default",
                },
                {
                  value: "minimal",
                  label: t("settings.layoutOptionMinimal"),
                  testId: "settings-layout-mode-minimal",
                },
              ]}
              ariaLabel={t("settings.layoutMode")}
            />
          </div>
        </div>
        <div className="rounded-t-2xl border-t border-slate-200/60 bg-slate-50/35 px-4 pb-3 pt-4 dark:border-slate-600/45 dark:bg-slate-700/20">
          {layoutMode === "default" ? (
            <div className="space-y-4">
              <SettingsRangeRow
                label={t("settings.gridColumns")}
                valueLabel={`${gridColumns}`}
                value={gridColumns}
                onChange={setGridColumns}
                min={3}
                max={10}
              />
              <SettingsRangeRow
                label={t("settings.gridRows")}
                valueLabel={`${gridRows}`}
                value={gridRows}
                onChange={setGridRows}
                min={1}
                max={6}
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <span className="text-sm text-slate-700 dark:text-slate-200">{t("settings.appearanceIconSize")}</span>
                <SegmentedControl<"small" | "medium" | "large">
                  value={iconSize}
                  onChange={setIconSize}
                  ariaLabel={t("settings.appearanceIconSize")}
                  options={[
                    { value: "small", label: t("settings.iconSizeSmall"), testId: "settings-layout-icon-size-small" },
                    { value: "medium", label: t("settings.iconSizeMedium"), testId: "settings-layout-icon-size-medium" },
                    { value: "large", label: t("settings.iconSizeLarge"), testId: "settings-layout-icon-size-large" },
                  ]}
                />
              </div>
              <SettingsToggleRow
                title={t("settings.gridShowLabels")}
                description={t("settings.gridShowLabelsDesc")}
                pressed={gridItemNamesVisible}
                onPressedChange={setGridItemNamesVisible}
                testId="settings-layout-show-labels"
              />
              <SettingsRangeRow
                label={t("settings.gridIconGap")}
                valueLabel={`${iconGap}px`}
                value={iconGap}
                onChange={setIconGap}
                min={8}
                max={36}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <SettingsToggleRow
                title={t("settings.minimalShowSearchBar")}
                description={t("settings.minimalShowSearchBarDesc")}
                pressed={minimalShowSearchBar}
                onPressedChange={setMinimalShowSearchBar}
                testId="settings-minimal-show-search"
              />
              <SettingsToggleRow
                title={t("settings.minimalShowQuickActions")}
                description={t("settings.minimalShowQuickActionsDesc")}
                pressed={minimalShowQuickActions}
                onPressedChange={setMinimalShowQuickActions}
                testId="settings-minimal-show-quick-actions"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <span className="text-sm text-slate-700 dark:text-slate-200">{t("settings.minimalContentWidth")}</span>
                <SegmentedControl<"narrow" | "standard" | "wide">
                  value={minimalContentWidth}
                  onChange={setMinimalContentWidth}
                  ariaLabel={t("settings.minimalContentWidth")}
                  options={[
                    {
                      value: "narrow",
                      label: t("settings.minimalContentWidthNarrow"),
                      testId: "settings-minimal-width-narrow",
                    },
                    {
                      value: "standard",
                      label: t("settings.minimalContentWidthStandard"),
                      testId: "settings-minimal-width-standard",
                    },
                    { value: "wide", label: t("settings.minimalContentWidthWide"), testId: "settings-minimal-width-wide" },
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsComingSoonBody() {
  const { t } = useAppI18n();
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24">
      <p className="max-w-sm text-center text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {t("settings.sectionComingSoon")}
      </p>
    </div>
  );
}

function SettingsAboutPanel() {
  const { locale } = useAppI18n();
  const openExternalUrl = useOpenExternalUrl();
  const iconPalette = useMemo(() => [Sparkles, Globe, Activity, ShieldCheck, FileText], []);
  const RandomIcon = useMemo(() => iconPalette[Math.floor(Math.random() * iconPalette.length)] ?? Globe, [iconPalette]);
  const aboutTagline = locale === "en-US" ? aboutContent.tagline["en-US"] : aboutContent.tagline["zh-CN"];
  const versionLabel = locale === "en-US" ? aboutContent.versionLabel["en-US"] : aboutContent.versionLabel["zh-CN"];
  const updatedLabel = locale === "en-US" ? aboutContent.updatedLabel["en-US"] : aboutContent.updatedLabel["zh-CN"];
  const copyright = locale === "en-US" ? aboutContent.copyright["en-US"] : aboutContent.copyright["zh-CN"];

  return (
    <div className={SETTINGS_MAIN_BODY_CLASS}>
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200/70 bg-white/72 p-4 dark:border-slate-600/60 dark:bg-slate-800/75">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/92 text-slate-700 shadow-sm dark:border-slate-500/70 dark:bg-slate-700/90 dark:text-slate-100">
              <RandomIcon className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{aboutContent.profileName}</div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{aboutTagline}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-slate-200/70 bg-white/60 px-3 py-2 dark:border-slate-600/70 dark:bg-slate-700/40">
            <div className="min-w-0 border-r border-slate-200/70 pr-3 dark:border-slate-600/70">
              <div className="text-xs text-slate-500 dark:text-slate-400">{versionLabel}</div>
              <div className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-100">{aboutContent.version}</div>
            </div>
            <div className="min-w-0 pl-1">
              <div className="text-xs text-slate-500 dark:text-slate-400">{updatedLabel}</div>
              <div className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-100">{aboutContent.updated}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white/72 p-2 dark:border-slate-600/60 dark:bg-slate-800/75">
          {aboutContent.links.map((item, index) => {
            const title = locale === "en-US" ? item.title["en-US"] : item.title["zh-CN"];
            const description = locale === "en-US" ? item.description["en-US"] : item.description["zh-CN"];
            return (
              <button
                key={item.id}
                type="button"
                className="relative flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-700/60"
                onClick={(e) => openExternalUrl(item.url, e)}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{description}</div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                {index < aboutContent.links.length - 1 ? (
                  <div className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-slate-200/70 dark:bg-slate-600/60" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      <div className="pt-2 text-center text-xs text-slate-400 dark:text-slate-500">{copyright}</div>
    </div>
  );
}

export function SettingsSpotlightModal({
  open,
  onClose,
  initialSection,
  layoutMode,
  onLayoutModeChange,
  openLinksInNewTab,
  onOpenLinksInNewTabChange,
  hiddenSpaceEnabled,
  hiddenItems,
  onEnableHiddenSpace,
  onDisableHiddenSpace,
  onVerifyHiddenPassword,
  onRemoveHiddenItems,
  onRestoreHiddenItems,
  isMinimalMode,
  folderHintResetVisible = false,
  onResetFolderHint,
}: SettingsSpotlightModalProps) {
  const { locale, setLocale, t } = useAppI18n();
  const { selectedSearchEngineId, setSearchEngine, sidebarLayout, setSidebarLayout } = useUiPreferences();
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("general");
  const [searchEnginePickerOpen, setSearchEnginePickerOpen] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState("");
  const [passwordConfirmDraft, setPasswordConfirmDraft] = useState("");
  const [verifyPasswordDraft, setVerifyPasswordDraft] = useState("");
  const [verifiedPassword, setVerifiedPassword] = useState("");
  const [selectedHiddenIds, setSelectedHiddenIds] = useState<Set<string>>(new Set());
  const [isHiddenEditing, setIsHiddenEditing] = useState(false);
  const [dialog, setDialog] = useState<"none" | "enable" | "verify-open" | "verify-disable" | "confirm-disable" | "panel">(
    "none",
  );
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [hiddenDeleteConfirmOpen, setHiddenDeleteConfirmOpen] = useState(false);
  const [availableSearchEngines, setAvailableSearchEngines] = useState<SearchEngine[]>(() => getAllSearchEngines());
  const searchEnginePickerRef = useRef<HTMLDivElement | null>(null);
  const openExternalUrl = useOpenExternalUrl();
  useDismissOnPointerDownOutside(searchEnginePickerRef, searchEnginePickerOpen, () => {
    setSearchEnginePickerOpen(false);
  });

  useEffect(() => {
    if (activeSection === "privacy") return;
    setDialog("none");
    setIsHiddenEditing(false);
    setSelectedHiddenIds(new Set());
    setHiddenDeleteConfirmOpen(false);
  }, [activeSection]);

  useEffect(() => {
    if (open) return;
    setDialog("none");
    setIsHiddenEditing(false);
    setSelectedHiddenIds(new Set());
    setHiddenDeleteConfirmOpen(false);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    setActiveSection(initialSection ?? "general");
  }, [open, initialSection]);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const fallback = {
        engines: getAllSearchEngines(),
        selectedEngineId: selectedSearchEngineId,
      };
      const payload = await loadSearchPayload(fallback);
      if (cancelled) return;
      setAvailableSearchEngines(payload.engines);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, selectedSearchEngineId]);

  useEffect(() => {
    if (availableSearchEngines.length === 0) return;
    const resolved = resolveSearchEngineId(selectedSearchEngineId, availableSearchEngines);
    if (resolved !== selectedSearchEngineId) {
      setSearchEngine(resolved);
    }
  }, [availableSearchEngines, selectedSearchEngineId, setSearchEngine]);

  const selectedSearchEngine =
    getSearchEngineById(selectedSearchEngineId, availableSearchEngines) ??
    getSearchEngineById(resolveSearchEngineId(null, availableSearchEngines), availableSearchEngines);

  if (!open) return null;

  let mainBody: ReactNode;
  if (activeSection === "general") {
    mainBody = (
      <div className={SETTINGS_MAIN_BODY_CLASS}>
        <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/72 p-4 dark:border-slate-600/60 dark:bg-slate-800/75">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div>
              <div className="text-sm font-medium">{t("settings.language")}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("settings.languageDesc")}</div>
            </div>
            <SegmentedControl<AppLocale>
              value={locale}
              onChange={setLocale}
              options={[
                {
                  value: "zh-CN",
                  label: t("settings.languageOptionZh"),
                  testId: "settings-locale-zh-CN",
                },
                {
                  value: "en-US",
                  label: t("settings.languageOptionEn"),
                  testId: "settings-locale-en-US",
                },
              ]}
              ariaLabel={t("settings.language")}
            />
          </div>
          <div className="h-px bg-slate-200/70 dark:bg-slate-600/50" />
          <div ref={searchEnginePickerRef} className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div>
              <div className="text-sm font-medium">{t("settings.defaultSearchEngine")}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("settings.defaultSearchEngineDesc")}</div>
            </div>
            <button
              type="button"
              data-testid="settings-default-search-engine-trigger"
              className="rounded-lg border border-slate-300/90 bg-white/92 px-3 py-1.5 text-xs text-slate-700 shadow-sm transition-colors hover:bg-white dark:border-slate-500/80 dark:bg-slate-700/95 dark:text-slate-100 dark:hover:bg-slate-600/95"
              onClick={() => setSearchEnginePickerOpen((v) => !v)}
            >
              {selectedSearchEngine ? getSearchEngineDisplayName(selectedSearchEngine, locale) : locale === "en-US" ? "Baidu" : "百度"}
            </button>
            {searchEnginePickerOpen ? (
              <div
                className="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-[180px] overflow-hidden rounded-xl border border-slate-300/90 bg-[rgb(251_250_247_/_0.95)] p-1.5 shadow-[0_14px_32px_-14px_rgba(15,23,42,0.34)] ring-1 ring-white/65 backdrop-blur-[10px] dark:border-slate-500/75 dark:bg-[rgb(37_44_56_/_0.96)] dark:shadow-[0_16px_34px_-16px_rgba(2,6,23,0.82)] dark:ring-white/8"
                role="listbox"
                aria-label={t("settings.chooseSearchEngine")}
              >
                {availableSearchEngines.map((engine) => {
                  const active = engine.id === selectedSearchEngine?.id;
                  return (
                    <button
                      key={engine.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      data-testid={`settings-default-search-engine-option-${engine.id}`}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                        active
                          ? "bg-sky-500/18 text-sky-800 dark:bg-sky-400/24 dark:text-sky-200"
                          : "text-slate-700 hover:bg-slate-200/70 dark:text-slate-200 dark:hover:bg-slate-600/55"
                      }`}
                      onClick={() => {
                        setSearchEngine(engine.id);
                        setSearchEnginePickerOpen(false);
                      }}
                    >
                      <span>{getSearchEngineDisplayName(engine, locale)}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          <div className="h-px bg-slate-200/70 dark:bg-slate-600/50" />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div>
              <div className="text-sm font-medium">{t("settings.linkOpenBehavior")}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("settings.linkOpenBehaviorDesc")}</div>
            </div>
            <SegmentedControl<"1" | "0">
              value={openLinksInNewTab ? "1" : "0"}
              onChange={(v) => onOpenLinksInNewTabChange(v === "1")}
              options={[
                {
                  value: "1",
                  label: t("settings.linkOpenNewTab"),
                  testId: "settings-link-open-new-tab",
                },
                {
                  value: "0",
                  label: t("settings.linkOpenSameTab"),
                  testId: "settings-link-open-same-tab",
                },
              ]}
              ariaLabel={t("settings.linkOpenBehavior")}
            />
          </div>
          <div className="h-px bg-slate-200/70 dark:bg-slate-600/50" />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div>
              <div className="text-sm font-medium">{t("settings.sidebarLayout")}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("settings.sidebarLayoutDesc")}</div>
              {isMinimalMode ? (
                <div className="mt-1 text-xs text-amber-600 dark:text-amber-300">{t("settings.sidebarLayoutLocked")}</div>
              ) : null}
            </div>
            <SegmentedControl<"auto-hide" | "always-visible">
              value={isMinimalMode ? "auto-hide" : sidebarLayout}
              onChange={setSidebarLayout}
              options={[
                {
                  value: "auto-hide",
                  label: t("settings.sidebarLayoutAutoHide"),
                  testId: "settings-sidebar-layout-auto-hide",
                },
                {
                  value: "always-visible",
                  label: t("settings.sidebarLayoutAlwaysVisible"),
                  testId: "settings-sidebar-layout-always-visible",
                },
              ]}
              ariaLabel={t("settings.sidebarLayout")}
              className={isMinimalMode ? "pointer-events-none opacity-50" : undefined}
            />
          </div>
          <div className="h-px bg-slate-200/70 dark:bg-slate-600/50" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{t("settings.openOnStartup")}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("settings.openOnStartupDesc")}</div>
            </div>
            <button className="rounded-lg border border-slate-200 bg-white/85 px-3 py-1.5 text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-700/90 dark:text-slate-200">
              {t("settings.newTabPage")}
            </button>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-200/70 bg-white/72 p-4 dark:border-slate-600/60 dark:bg-slate-800/75">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Bell className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            {t("settings.startupContent")}
          </div>
          {TOGGLES.map((item) => (
            <div key={item.titleKey} className="flex items-center justify-between gap-3 py-2">
              <div>
                <div className="text-sm text-slate-900 dark:text-slate-100">{t(item.titleKey)}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{t(item.descKey)}</div>
              </div>
              <span
                className={`inline-flex h-6 w-10 items-center rounded-full p-0.5 transition-colors ${
                  item.enabled ? "bg-sky-500/90" : "bg-slate-300"
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    item.enabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  } else if (activeSection === "appearance") {
    mainBody = <SettingsAppearancePanel layoutMode={layoutMode} onLayoutModeChange={onLayoutModeChange} />;
  } else if (activeSection === "privacy") {
    mainBody = (
      <div className={SETTINGS_MAIN_BODY_CLASS}>
        <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/72 p-4 dark:border-slate-600/60 dark:bg-slate-800/75">
          <div className="flex items-center justify-between gap-3 py-2">
            <div>
              <div className="text-sm font-medium">隐藏空间</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">启用后可将内容隐藏到受密码保护的空间</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hiddenSpaceEnabled}
              data-testid="settings-hidden-space-toggle"
              className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                hiddenSpaceEnabled ? "bg-sky-500/90" : "bg-slate-300"
              }`}
              onClick={() => {
                setPasswordError(null);
                setVerifyPasswordDraft("");
                setDialog(hiddenSpaceEnabled ? "verify-disable" : "enable");
              }}
            >
              <span
                className={`pointer-events-none h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  hiddenSpaceEnabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          {hiddenSpaceEnabled ? (
            <>
              <div className="h-px bg-slate-200/70 dark:bg-slate-600/50" />
              <div className="flex items-center justify-between gap-3 py-2">
                <div>
                  <div className="text-sm font-medium">浏览隐藏空间</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">输入密码后可查看并管理隐藏图标</div>
                </div>
                <button
                  type="button"
                  data-testid="settings-hidden-space-open-panel"
                  className="rounded-lg border border-slate-200 bg-white/85 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-white dark:border-slate-600 dark:bg-slate-700/90 dark:text-slate-200 dark:hover:bg-slate-600/90"
                  onClick={() => {
                    setPasswordError(null);
                    setVerifyPasswordDraft("");
                    setDialog("verify-open");
                  }}
                >
                  进入
                </button>
              </div>
              {folderHintResetVisible ? (
                <>
                  <div className="h-px bg-slate-200/70 dark:bg-slate-600/50" />
                  <div className="flex items-center justify-between gap-3 py-2">
                    <div>
                      <div className="text-sm font-medium">重置隐藏文件夹提示</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        仅开发模式可见，用于重新触发首次确认弹窗
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 bg-white/85 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-white dark:border-slate-600 dark:bg-slate-700/90 dark:text-slate-200 dark:hover:bg-slate-600/90"
                      onClick={() => onResetFolderHint?.()}
                    >
                      重置
                    </button>
                  </div>
                </>
              ) : null}
            </>
          ) : null}
        </div>
        {hiddenSpaceEnabled && dialog === "panel" ? (
          <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/72 p-4 dark:border-slate-600/60 dark:bg-slate-800/75">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium">隐藏空间</div>
              <div className="flex items-center gap-2">
                {isHiddenEditing && hiddenItems.length > 0 ? (
                  <button
                    type="button"
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs dark:border-slate-600"
                    onClick={() => {
                      if (selectedHiddenIds.size === hiddenItems.length) {
                        setSelectedHiddenIds(new Set());
                        return;
                      }
                      setSelectedHiddenIds(new Set(hiddenItems.map((item) => item.id)));
                    }}
                  >
                    {selectedHiddenIds.size === hiddenItems.length ? "全部取消" : "全选"}
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={hiddenItems.length === 0}
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600"
                  onClick={() => {
                    if (isHiddenEditing) {
                      setIsHiddenEditing(false);
                      setSelectedHiddenIds(new Set());
                      return;
                    }
                    setIsHiddenEditing(true);
                  }}
                >
                  {isHiddenEditing ? "完成" : "编辑"}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs dark:border-slate-600"
                  onClick={() => {
                    setDialog("none");
                    setIsHiddenEditing(false);
                    setSelectedHiddenIds(new Set());
                  }}
                >
                  收起
                </button>
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto pr-1">
              {hiddenItems.length === 0 ? (
                <div className="text-xs text-slate-500 dark:text-slate-400">暂无隐藏图标</div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] justify-items-center gap-x-6 gap-y-6 py-2">
                  {hiddenItems.map((item) => {
                    const selected = selectedHiddenIds.has(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="group relative flex w-[100px] flex-col items-center gap-2"
                        onClick={(e) => {
                          if (isHiddenEditing) {
                            e.preventDefault();
                            setSelectedHiddenIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(item.id)) next.delete(item.id);
                              else next.add(item.id);
                              return next;
                            });
                            return;
                          }
                          openExternalUrl(item.site.url, e);
                        }}
                      >
                        <div
                          className="flex h-[84px] w-[84px] items-center justify-center rounded-[24px] border border-slate-200/70 bg-white/75 shadow-sm transition-transform duration-200 group-hover:scale-105 dark:border-slate-600/70 dark:bg-slate-700/80"
                          style={
                            isHiddenEditing && selected
                              ? {
                                  boxShadow: "inset 0 0 0 2px rgba(59,130,246,0.95), inset 0 0 0 3px rgba(255,255,255,0.2)",
                                }
                              : undefined
                          }
                        >
                          <Favicon domain={item.site.domain} name={item.site.name} size={48} />
                        </div>
                        <div className="w-[100px] truncate text-center text-[13px] font-medium text-slate-700 dark:text-slate-200">
                          {item.site.name}
                        </div>
                        {isHiddenEditing ? (
                          <div
                            className={`absolute right-1 top-1 h-4 w-4 rounded border ${
                              selected
                                ? "border-sky-500 bg-sky-500"
                                : "border-slate-300 bg-white dark:border-slate-500 dark:bg-slate-800"
                            }`}
                            aria-hidden
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {isHiddenEditing ? (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={selectedHiddenIds.size === 0 || isMinimalMode}
                  className="rounded-lg border border-slate-200 bg-white/85 px-3 py-1.5 text-xs text-slate-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700/90 dark:text-slate-200 dark:hover:bg-slate-600/90"
                  onClick={() =>
                    onRestoreHiddenItems(hiddenItems.filter((item) => selectedHiddenIds.has(item.id)))
                  }
                  title={isMinimalMode ? "极简模式下不可恢复到主页面，请切换为默认模式" : undefined}
                >
                  暴露到主页面
                </button>
                <button
                  type="button"
                  disabled={selectedHiddenIds.size === 0}
                  className="rounded-lg border border-red-200 bg-red-50/90 px-3 py-1.5 text-xs text-red-600 transition-colors hover:bg-red-100/90 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-200"
                  onClick={() => setHiddenDeleteConfirmOpen(true)}
                >
                  删除
                </button>
                {isMinimalMode ? (
                  <div className="text-xs text-amber-600 dark:text-amber-300">
                    极简模式下不可恢复到主页面，请切换为默认模式
                    </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  } else if (activeSection === "about") {
    mainBody = <SettingsAboutPanel />;
  } else {
    mainBody = <SettingsComingSoonBody />;
  }

  return (
    <>
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-x-hidden p-6 md:p-10"
      role="dialog"
      aria-modal="true"
      aria-label={t("settings.title")}
      data-ui-modal-overlay
    >
      <button
        type="button"
        aria-label={t("settings.close")}
        className="absolute inset-0 z-0 bg-slate-900/30 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Spotlight halo: keep subtle so panel edge remains crisp */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-[min(80vh,860px)] w-[min(80vw,1140px)] -translate-x-1/2 -translate-y-1/2 rounded-[44px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.22),rgba(255,255,255,0)_68%)]"
      />

      {/*
        呼吸式尺寸：在最小/首选/最大之间伸展，避免大屏固定 920x620；长内容仅在右侧 scrollbar-none 区域滚动。
      */}
      <div className="pointer-events-none relative z-10 flex w-full min-w-0 justify-center">
        <div className="pointer-events-auto flex h-[clamp(620px,78vh,860px)] max-h-[calc(100vh-3rem)] w-[clamp(860px,70vw,1140px)] max-w-[calc(100vw-3rem)] min-w-0 flex-col overflow-hidden rounded-[24px] border border-white/55 bg-white/90 shadow-[0_30px_90px_rgba(2,6,23,0.5),0_12px_32px_rgba(15,23,42,0.38)] backdrop-blur-xl dark:border-slate-600/50 dark:bg-slate-900/95">
          <div className="grid h-full min-h-0 min-w-0 flex-1 grid-cols-[180px_minmax(0,1fr)] grid-rows-1">
            <aside className="flex h-full min-h-0 flex-col overflow-y-auto border-r border-slate-200/65 bg-white/58 px-2 py-4 scrollbar-none dark:border-slate-700/80 dark:bg-slate-900/70">
            <div className="mb-4">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  readOnly
                  value=""
                  placeholder={t("settings.searchPlaceholder")}
                  className="w-full rounded-xl border border-slate-200 bg-white/70 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200 dark:placeholder:text-slate-500"
                />
              </div>
            </div>
            <nav className="space-y-1" aria-label={t("settings.title")}>
              {SECTIONS.map(({ id, labelKey, Icon }) => {
                const active = id === activeSection;
                return (
                  <button
                    key={id}
                    type="button"
                    data-testid={`settings-nav-${id}`}
                    aria-current={active ? "true" : undefined}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? "bg-slate-900/8 text-slate-900 dark:bg-white/10 dark:text-slate-100"
                        : "text-slate-700 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/5"
                    }`}
                    onClick={() => setActiveSection(id)}
                  >
                    <Icon className="h-4 w-4 opacity-85" />
                    <span>{t(labelKey)}</span>
                  </button>
                );
              })}
            </nav>
            </aside>

            <section className="relative flex h-full min-h-0 min-w-0 flex-col">
            <div className="flex min-w-0 shrink-0 items-center justify-end gap-3 px-6 py-4">
              <button
                type="button"
                data-testid="settings-modal-close"
                aria-label={t("settings.close")}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-900/5 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-300"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="scrollbar-none min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
              {mainBody}
            </div>
            {dialog !== "none" && dialog !== "panel" ? (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/35 p-6" data-ui-modal-overlay>
                <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xl dark:border-slate-600 dark:bg-slate-800">
                  {dialog === "enable" ? (
                    <div className="space-y-3">
                      <div className="text-sm font-medium">开启隐藏空间</div>
                      <input
                        type="password"
                        value={passwordDraft}
                        onChange={(e) => setPasswordDraft(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key !== "Enter") return;
                          e.preventDefault();
                          if (passwordDraft.length < 4) {
                            setPasswordError("密码长度至少 4 位");
                            return;
                          }
                          if (passwordDraft !== passwordConfirmDraft) {
                            setPasswordError("两次输入密码不一致");
                            return;
                          }
                          await onEnableHiddenSpace(passwordDraft);
                          setDialog("none");
                          setPasswordDraft("");
                          setPasswordConfirmDraft("");
                          setPasswordError(null);
                        }}
                        placeholder="请输入密码（至少 4 位）"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
                      />
                      <input
                        type="password"
                        value={passwordConfirmDraft}
                        onChange={(e) => setPasswordConfirmDraft(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key !== "Enter") return;
                          e.preventDefault();
                          if (passwordDraft.length < 4) {
                            setPasswordError("密码长度至少 4 位");
                            return;
                          }
                          if (passwordDraft !== passwordConfirmDraft) {
                            setPasswordError("两次输入密码不一致");
                            return;
                          }
                          await onEnableHiddenSpace(passwordDraft);
                          setDialog("none");
                          setPasswordDraft("");
                          setPasswordConfirmDraft("");
                          setPasswordError(null);
                        }}
                        placeholder="请再次输入密码"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
                      />
                      {passwordError ? <div className="text-xs text-red-500">{passwordError}</div> : null}
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-600"
                          onClick={() => {
                            setDialog("none");
                            setPasswordDraft("");
                            setPasswordConfirmDraft("");
                            setPasswordError(null);
                          }}
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs text-white"
                          onClick={async () => {
                            if (passwordDraft.length < 4) {
                              setPasswordError("密码长度至少 4 位");
                              return;
                            }
                            if (passwordDraft !== passwordConfirmDraft) {
                              setPasswordError("两次输入密码不一致");
                              return;
                            }
                            await onEnableHiddenSpace(passwordDraft);
                            setDialog("none");
                            setPasswordDraft("");
                            setPasswordConfirmDraft("");
                            setPasswordError(null);
                          }}
                        >
                          开启
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {dialog === "verify-open" || dialog === "verify-disable" ? (
                    <div className="space-y-3">
                      <div className="text-sm font-medium">请输入隐藏空间密码</div>
                      <input
                        type="password"
                        value={verifyPasswordDraft}
                        onChange={(e) => setVerifyPasswordDraft(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key !== "Enter") return;
                          e.preventDefault();
                          const ok = await onVerifyHiddenPassword(verifyPasswordDraft);
                          if (!ok) {
                            setPasswordError("密码错误");
                            return;
                          }
                          if (dialog === "verify-open") {
                            setIsHiddenEditing(false);
                            setSelectedHiddenIds(new Set());
                            setDialog("panel");
                          } else {
                            setVerifiedPassword(verifyPasswordDraft);
                            setDialog("confirm-disable");
                          }
                          setVerifyPasswordDraft("");
                          setPasswordError(null);
                        }}
                        placeholder="请输入密码"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
                      />
                      {passwordError ? <div className="text-xs text-red-500">{passwordError}</div> : null}
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-600"
                          onClick={() => {
                            setDialog("none");
                            setVerifyPasswordDraft("");
                            setPasswordError(null);
                          }}
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs text-white"
                          onClick={async () => {
                            const ok = await onVerifyHiddenPassword(verifyPasswordDraft);
                            if (!ok) {
                              setPasswordError("密码错误");
                              return;
                            }
                            if (dialog === "verify-open") {
                              setIsHiddenEditing(false);
                              setSelectedHiddenIds(new Set());
                              setDialog("panel");
                            } else {
                              setVerifiedPassword(verifyPasswordDraft);
                              setDialog("confirm-disable");
                            }
                            setVerifyPasswordDraft("");
                            setPasswordError(null);
                          }}
                        >
                          确认
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {dialog === "confirm-disable" ? (
                    <div className="space-y-3">
                      <div className="text-sm font-medium">关闭后将清空所有隐藏图标及密码，且不可恢复</div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-600"
                          onClick={() => setDialog("none")}
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs text-white"
                          onClick={async () => {
                            const ok = await onDisableHiddenSpace(verifiedPassword);
                            if (!ok) return;
                            setSelectedHiddenIds(new Set());
                            setVerifiedPassword("");
                            setDialog("none");
                          }}
                        >
                          确认关闭
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
            </section>
          </div>
        </div>
      </div>
    </div>

    <GlassMessageDialog
      open={hiddenDeleteConfirmOpen}
      overlayClassName="z-[130]"
      title="删除隐藏图标"
      message="确认删除所选隐藏图标吗？"
      variant="confirm"
      cancelLabel="取消"
      confirmLabel="删除"
      confirmDestructive
      onCancel={() => setHiddenDeleteConfirmOpen(false)}
      onConfirm={() => {
        onRemoveHiddenItems(Array.from(selectedHiddenIds));
        setSelectedHiddenIds(new Set());
        setHiddenDeleteConfirmOpen(false);
      }}
    />
    </>
  );
}
