import { Activity, ArrowRight, Bell, FileText, Globe, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState, type MouseEvent, type Ref, type RefObject } from "react";
import { useAppI18n, type AppLocale } from "../i18n/AppI18n";
import { useOpenExternalUrl } from "../navigation";
import { useUiPreferences, type LayoutMode } from "../preferences";
import aboutContent from "../config/about-content.json";
import { DEFAULT_NEW_TAB_BACKGROUND_URL } from "./feedback";
import { AddIconPanelContent, type AddIconSubmitPayload } from "./addIcon";
import { SegmentedControl } from "./shared/SegmentedControl";
import { getSearchEngineDisplayName, type SearchEngine } from "../search/searchEngineRegistry";
import type { MessageKey } from "../i18n/messages";
import type { SiteItem } from "./desktopGridTypes";
import { Favicon } from "./DesktopGridItemPrimitives";
import type { PickLocalImageFailureReason } from "../localUpload/pickLocalImageAsDataUrl";
import { useUserLocalAssets } from "../localUpload";
import { LocalFileUploadButton } from "./localUpload/LocalFileUploadButton";
export { SettingsAccountPanel } from "./SettingsAccountPanel";
export { SettingsWallpaperPanel } from "./SettingsWallpaperPanel";

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

type SettingsAppearancePanelProps = {
  mainBodyClassName: string;
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
};

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
export function SettingsAppearancePanel({ mainBodyClassName, layoutMode, onLayoutModeChange }: SettingsAppearancePanelProps) {
  const { t } = useAppI18n();
  const { colorScheme, setColorScheme, gridItemNamesVisible, setGridItemNamesVisible } = useUiPreferences();
  const { wallpaperDataUrl, setWallpaperDataUrl } = useUserLocalAssets();
  const [wallpaperUploadMessage, setWallpaperUploadMessage] = useState<string | null>(null);
  const [gridColumns, setGridColumns] = useState(6);
  const [gridRows, setGridRows] = useState(2);
  const [iconSize, setIconSize] = useState<"small" | "medium" | "large">("medium");
  const [iconGap, setIconGap] = useState(16);
  const [minimalShowSearchBar, setMinimalShowSearchBar] = useState(true);
  const [minimalShowQuickActions, setMinimalShowQuickActions] = useState(true);
  const [minimalContentWidth, setMinimalContentWidth] = useState<"narrow" | "standard" | "wide">("standard");

  const wallpaperPreviewSrc = wallpaperDataUrl ?? DEFAULT_NEW_TAB_BACKGROUND_URL;

  useEffect(() => {
    if (!wallpaperUploadMessage) return;
    const id = window.setTimeout(() => setWallpaperUploadMessage(null), 4500);
    return () => window.clearTimeout(id);
  }, [wallpaperUploadMessage]);

  return (
    <div className={mainBodyClassName}>
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
            src={wallpaperPreviewSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            width={280}
            height={112}
            draggable={false}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LocalFileUploadButton
            className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-white dark:border-slate-600 dark:bg-slate-700/90 dark:text-slate-100 dark:hover:bg-slate-600/90"
            onPick={({ dataUrl }) => {
              setWallpaperUploadMessage(null);
              setWallpaperDataUrl(dataUrl);
            }}
            onPickError={(reason) => {
              const key = mapPickFailureToMessageKey(reason);
              setWallpaperUploadMessage(key ? t(key) : null);
            }}
          >
            {t("settings.appearancePickWallpaper")}
          </LocalFileUploadButton>
          <button
            type="button"
            disabled={!wallpaperDataUrl}
            className="rounded-lg border border-slate-200 bg-white/60 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-white enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/90"
            onClick={() => {
              setWallpaperUploadMessage(null);
              setWallpaperDataUrl(null);
            }}
          >
            {t("settings.appearanceResetWallpaper")}
          </button>
        </div>
        {wallpaperUploadMessage ? (
          <div className="text-xs text-amber-700 dark:text-amber-300" role="status">
            {wallpaperUploadMessage}
          </div>
        ) : null}
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

type SettingsAboutPanelProps = {
  mainBodyClassName: string;
};

export function SettingsAboutPanel({ mainBodyClassName }: SettingsAboutPanelProps) {
  const { locale, t } = useAppI18n();
  const openExternalUrl = useOpenExternalUrl();
  const { avatarDataUrl, setAvatarDataUrl } = useUserLocalAssets();
  const [avatarUploadMessage, setAvatarUploadMessage] = useState<string | null>(null);
  const iconPalette = useMemo(() => [Sparkles, Globe, Activity, ShieldCheck, FileText], []);
  const RandomIcon = useMemo(() => iconPalette[Math.floor(Math.random() * iconPalette.length)] ?? Globe, [iconPalette]);
  const aboutTagline = locale === "en-US" ? aboutContent.tagline["en-US"] : aboutContent.tagline["zh-CN"];
  const versionLabel = locale === "en-US" ? aboutContent.versionLabel["en-US"] : aboutContent.versionLabel["zh-CN"];
  const updatedLabel = locale === "en-US" ? aboutContent.updatedLabel["en-US"] : aboutContent.updatedLabel["zh-CN"];
  const copyright = locale === "en-US" ? aboutContent.copyright["en-US"] : aboutContent.copyright["zh-CN"];

  useEffect(() => {
    if (!avatarUploadMessage) return;
    const id = window.setTimeout(() => setAvatarUploadMessage(null), 4500);
    return () => window.clearTimeout(id);
  }, [avatarUploadMessage]);

  return (
    <div className={mainBodyClassName}>
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200/70 bg-white/72 p-4 dark:border-slate-600/60 dark:bg-slate-800/75">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-white/92 text-slate-700 shadow-sm dark:border-slate-500/70 dark:bg-slate-700/90 dark:text-slate-100">
                {avatarDataUrl ? (
                  <img src={avatarDataUrl} alt="" className="h-full w-full object-cover" width={64} height={64} />
                ) : (
                  <RandomIcon className="h-8 w-8" />
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{aboutContent.profileName}</div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{aboutTagline}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <LocalFileUploadButton
                  className="rounded-lg border border-slate-200 bg-white/85 px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-white dark:border-slate-600 dark:bg-slate-700/90 dark:text-slate-100 dark:hover:bg-slate-600/90"
                  onPick={({ dataUrl }) => {
                    setAvatarUploadMessage(null);
                    setAvatarDataUrl(dataUrl);
                  }}
                  onPickError={(reason) => {
                    const key = mapPickFailureToMessageKey(reason);
                    setAvatarUploadMessage(key ? t(key) : null);
                  }}
                >
                  {t("settings.aboutUploadAvatar")}
                </LocalFileUploadButton>
                <button
                  type="button"
                  disabled={!avatarDataUrl}
                  className="rounded-lg border border-slate-200 bg-white/60 px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-white enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/90"
                  onClick={() => {
                    setAvatarUploadMessage(null);
                    setAvatarDataUrl(null);
                  }}
                >
                  {t("settings.aboutResetAvatar")}
                </button>
              </div>
              {avatarUploadMessage ? (
                <div className="mt-2 text-xs text-amber-700 dark:text-amber-300" role="status">
                  {avatarUploadMessage}
                </div>
              ) : null}
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

export function SettingsSitesAndComponentsPanel({ onConfirmAdd }: { onConfirmAdd: (payload: AddIconSubmitPayload) => void }) {
  return (
    <div className="flex min-h-full min-w-0 flex-col px-6 pb-6 pt-1.5 text-slate-800 dark:text-slate-100">
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/72 p-2 dark:border-slate-600/60 dark:bg-slate-800/75">
        <AddIconPanelContent
          contextSiteId={null}
          onConfirmAdd={onConfirmAdd}
          onRequestClose={() => {}}
          showCloseButton={false}
          className="flex h-full min-h-0 flex-col sm:flex-row"
        />
      </div>
    </div>
  );
}

export function SettingsComingSoonBody() {
  const { t } = useAppI18n();
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24">
      <p className="max-w-sm text-center text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {t("settings.sectionComingSoon")}
      </p>
    </div>
  );
}

type SettingsGeneralPanelProps = {
  mainBodyClassName: string;
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  selectedSearchEngine: SearchEngine | null;
  availableSearchEngines: SearchEngine[];
  searchEnginePickerOpen: boolean;
  setSearchEnginePickerOpen: (next: boolean | ((prev: boolean) => boolean)) => void;
  onSelectSearchEngine: (engineId: string) => void;
  openLinksInNewTab: boolean;
  onOpenLinksInNewTabChange: (value: boolean) => void;
  isMinimalMode: boolean;
  sidebarLayout: "auto-hide" | "always-visible";
  setSidebarLayout: (next: "auto-hide" | "always-visible") => void;
  searchEnginePickerRef: RefObject<HTMLDivElement | null>;
  toggles: ReadonlyArray<{
    titleKey: MessageKey;
    descKey: MessageKey;
    enabled: boolean;
  }>;
};

export function SettingsGeneralPanel({
  mainBodyClassName,
  locale,
  setLocale,
  selectedSearchEngine,
  availableSearchEngines,
  searchEnginePickerOpen,
  setSearchEnginePickerOpen,
  onSelectSearchEngine,
  openLinksInNewTab,
  onOpenLinksInNewTabChange,
  isMinimalMode,
  sidebarLayout,
  setSidebarLayout,
  searchEnginePickerRef,
  toggles,
}: SettingsGeneralPanelProps) {
  const { t } = useAppI18n();
  return (
    <div className={mainBodyClassName}>
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
        <div ref={searchEnginePickerRef as Ref<HTMLDivElement>} className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
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
                      onSelectSearchEngine(engine.id);
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
        {toggles.map((item) => (
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
}

export type HiddenSpaceDialogState = "none" | "enable" | "verify-open" | "verify-disable" | "confirm-disable" | "panel";

type SettingsPrivacyPanelProps = {
  mainBodyClassName: string;
  hiddenSpaceEnabled: boolean;
  hiddenItems: SiteItem[];
  dialog: HiddenSpaceDialogState;
  isHiddenEditing: boolean;
  selectedHiddenIds: Set<string>;
  isMinimalMode: boolean;
  folderHintResetVisible: boolean;
  onResetFolderHint?: () => void;
  onRequestToggleHiddenSpace: () => void;
  onRequestOpenHiddenPanel: () => void;
  onToggleSelectAll: () => void;
  onToggleEditing: () => void;
  onCollapsePanel: () => void;
  onHiddenItemClick: (item: SiteItem, e: MouseEvent<HTMLButtonElement>) => void;
  onRestoreSelected: () => void;
  onOpenDeleteConfirm: () => void;
};

export function SettingsPrivacyPanel({
  mainBodyClassName,
  hiddenSpaceEnabled,
  hiddenItems,
  dialog,
  isHiddenEditing,
  selectedHiddenIds,
  isMinimalMode,
  folderHintResetVisible,
  onResetFolderHint,
  onRequestToggleHiddenSpace,
  onRequestOpenHiddenPanel,
  onToggleSelectAll,
  onToggleEditing,
  onCollapsePanel,
  onHiddenItemClick,
  onRestoreSelected,
  onOpenDeleteConfirm,
}: SettingsPrivacyPanelProps) {
  return (
    <div className={mainBodyClassName}>
      <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/72 p-4 dark:border-slate-600/60 dark:bg-slate-800/75">
        <div className="flex items-center justify-between gap-3 py-2">
          <div>
            <div className="text-sm font-medium">隐私空间</div>
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
            onClick={onRequestToggleHiddenSpace}
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
                <div className="text-sm font-medium">浏览隐私空间</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">输入密码后可查看并管理隐藏图标</div>
              </div>
              <button
                type="button"
                data-testid="settings-hidden-space-open-panel"
                className="rounded-lg border border-slate-200 bg-white/85 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-white dark:border-slate-600 dark:bg-slate-700/90 dark:text-slate-200 dark:hover:bg-slate-600/90"
                onClick={onRequestOpenHiddenPanel}
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
            <div className="text-sm font-medium">隐私空间</div>
            <div className="flex items-center gap-2">
              {isHiddenEditing && hiddenItems.length > 0 ? (
                <button
                  type="button"
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs dark:border-slate-600"
                  onClick={onToggleSelectAll}
                >
                  {selectedHiddenIds.size === hiddenItems.length ? "全部取消" : "全选"}
                </button>
              ) : null}
              <button
                type="button"
                disabled={hiddenItems.length === 0}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600"
                onClick={onToggleEditing}
              >
                {isHiddenEditing ? "完成" : "编辑"}
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-200 px-2 py-1 text-xs dark:border-slate-600"
                onClick={onCollapsePanel}
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
                      onClick={(e) => onHiddenItemClick(item, e)}
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
                onClick={onRestoreSelected}
                title={isMinimalMode ? "极简模式下不可恢复到主页面，请切换为默认模式" : undefined}
              >
                暴露到主页面
              </button>
              <button
                type="button"
                disabled={selectedHiddenIds.size === 0}
                className="rounded-lg border border-red-200 bg-red-50/90 px-3 py-1.5 text-xs text-red-600 transition-colors hover:bg-red-100/90 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-200"
                onClick={onOpenDeleteConfirm}
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
}
