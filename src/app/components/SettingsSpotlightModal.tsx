import {
  Bell,
  Boxes,
  Globe,
  MonitorCog,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { DEFAULT_NEW_TAB_BACKGROUND_URL } from "./feedback";
import { useAppI18n, type AppLocale } from "../i18n/AppI18n";
import type { LayoutMode } from "../preferences";
import { SegmentedControl } from "./shared/SegmentedControl";

type SettingsSpotlightModalProps = {
  open: boolean;
  onClose: () => void;
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
  openLinksInNewTab: boolean;
  onOpenLinksInNewTabChange: (value: boolean) => void;
};

const SECTIONS = [
  { id: "general", labelKey: "settings.general", Icon: SlidersHorizontal },
  { id: "appearance", labelKey: "settings.appearance", Icon: Sparkles },
  { id: "search", labelKey: "settings.searchEngine", Icon: Search },
  { id: "new-tab", labelKey: "settings.newTab", Icon: MonitorCog },
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
        <div className="text-sm">{title}</div>
        {description ? <div className="break-words text-xs text-slate-500">{description}</div> : null}
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
        <span className="text-sm text-slate-700">{label}</span>
        <span className="text-xs tabular-nums text-slate-500">{valueLabel}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200/90 accent-sky-500"
      />
    </div>
  );
}

/** 外观页：控件状态仅用于面板内展示，后续可接入 preferences。 */
function SettingsAppearancePanel() {
  const { t } = useAppI18n();
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [wallpaperBlur, setWallpaperBlur] = useState(true);
  const [autoDimWallpaper, setAutoDimWallpaper] = useState(true);
  const [blurStrength, setBlurStrength] = useState(42);
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [iconSize, setIconSize] = useState(58);
  const [iconShape, setIconShape] = useState<"medium" | "large">("medium");
  const [glassEffect, setGlassEffect] = useState(true);

  return (
    <div className="min-w-0 max-w-full space-y-6 px-6 pb-6 pt-4 text-slate-800">
      <div className="min-w-0 space-y-4 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/72 p-4">
        <div className="text-sm font-medium">{t("settings.appearanceTheme")}</div>
        <SegmentedControl<"light" | "dark" | "system">
          value={theme}
          onChange={setTheme}
          ariaLabel={t("settings.appearanceTheme")}
          options={[
            { value: "light", label: t("settings.appearanceThemeLight"), testId: "settings-appearance-theme-light" },
            { value: "dark", label: t("settings.appearanceThemeDark"), testId: "settings-appearance-theme-dark" },
            {
              value: "system",
              label: t("settings.appearanceThemeSystem"),
              testId: "settings-appearance-theme-system",
            },
          ]}
        />
      </div>

      <div className="min-w-0 space-y-4 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/72 p-4">
        <div className="min-w-0">
          <div className="text-sm font-medium">{t("settings.appearanceWallpaper")}</div>
          <div className="mt-1 break-words text-xs text-slate-500">{t("settings.appearanceWallpaperHint")}</div>
        </div>
        {/* 固定宽高比容器 + 绝对定位图片：彻底切断 intrinsic 宽度参与布局 */}
        <div className="relative mx-auto aspect-[5/2] w-full max-w-[280px] overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100/50 shadow-inner">
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
          className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-white"
        >
          {t("settings.appearancePickWallpaper")}
        </button>
        <div className="h-px bg-slate-200/70" />
        <SettingsToggleRow
          title={t("settings.appearanceWallpaperBlur")}
          description={t("settings.appearanceWallpaperBlurDesc")}
          pressed={wallpaperBlur}
          onPressedChange={setWallpaperBlur}
          testId="settings-appearance-wallpaper-blur"
        />
        <SettingsToggleRow
          title={t("settings.appearanceAutoDimWallpaper")}
          description={t("settings.appearanceAutoDimWallpaperDesc")}
          pressed={autoDimWallpaper}
          onPressedChange={setAutoDimWallpaper}
          testId="settings-appearance-auto-dim"
        />
        <SettingsRangeRow
          label={t("settings.appearanceBlurStrength")}
          valueLabel={`${blurStrength}%`}
          value={blurStrength}
          onChange={setBlurStrength}
          min={0}
          max={100}
        />
      </div>

      <div className="min-w-0 space-y-3 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/72 p-4">
        <div className="text-sm font-medium">{t("settings.appearanceLayoutSection")}</div>
        <SettingsToggleRow
          title={t("settings.appearanceShowSearchBar")}
          description={t("settings.appearanceShowSearchBarDesc")}
          pressed={showSearchBar}
          onPressedChange={setShowSearchBar}
          testId="settings-appearance-show-search"
        />
        <SettingsRangeRow
          label={t("settings.appearanceIconSize")}
          valueLabel={`${iconSize}%`}
          value={iconSize}
          onChange={setIconSize}
          min={40}
          max={100}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="text-sm text-slate-700">{t("settings.appearanceIconShape")}</span>
          <SegmentedControl<"medium" | "large">
            value={iconShape}
            onChange={setIconShape}
            ariaLabel={t("settings.appearanceIconShape")}
            options={[
              {
                value: "medium",
                label: t("settings.appearanceIconShapeMedium"),
                testId: "settings-appearance-icon-medium",
              },
              {
                value: "large",
                label: t("settings.appearanceIconShapeLarge"),
                testId: "settings-appearance-icon-large",
              },
            ]}
          />
        </div>
        <div className="h-px bg-slate-200/70" />
        <SettingsToggleRow
          title={t("settings.appearanceGlassEffect")}
          description={t("settings.appearanceGlassEffectDesc")}
          pressed={glassEffect}
          onPressedChange={setGlassEffect}
          testId="settings-appearance-glass"
        />
      </div>
    </div>
  );
}

function SettingsComingSoonBody() {
  const { t } = useAppI18n();
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24">
      <p className="max-w-sm text-center text-sm leading-relaxed text-slate-500">{t("settings.sectionComingSoon")}</p>
    </div>
  );
}

export function SettingsSpotlightModal({
  open,
  onClose,
  layoutMode,
  onLayoutModeChange,
  openLinksInNewTab,
  onOpenLinksInNewTabChange,
}: SettingsSpotlightModalProps) {
  const { locale, setLocale, t } = useAppI18n();
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("general");

  if (!open) return null;

  let mainBody: ReactNode;
  if (activeSection === "general") {
    mainBody = (
      <div className="min-w-0 max-w-full space-y-6 px-6 pb-6 pt-4 text-slate-800">
        <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/72 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div>
              <div className="text-sm font-medium">{t("settings.language")}</div>
              <div className="text-xs text-slate-500">{t("settings.languageDesc")}</div>
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
          <div className="h-px bg-slate-200/70" />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div>
              <div className="text-sm font-medium">{t("settings.layoutMode")}</div>
              <div className="text-xs text-slate-500">{t("settings.layoutModeDesc")}</div>
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
          <div className="h-px bg-slate-200/70" />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div>
              <div className="text-sm font-medium">{t("settings.linkOpenBehavior")}</div>
              <div className="text-xs text-slate-500">{t("settings.linkOpenBehaviorDesc")}</div>
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
          <div className="h-px bg-slate-200/70" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{t("settings.openOnStartup")}</div>
              <div className="text-xs text-slate-500">{t("settings.openOnStartupDesc")}</div>
            </div>
            <button className="rounded-lg border border-slate-200 bg-white/85 px-3 py-1.5 text-xs text-slate-600">
              {t("settings.newTabPage")}
            </button>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-200/70 bg-white/72 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Bell className="h-4 w-4 text-slate-500" />
            {t("settings.startupContent")}
          </div>
          {TOGGLES.map((item) => (
            <div key={item.titleKey} className="flex items-center justify-between gap-3 py-2">
              <div>
                <div className="text-sm">{t(item.titleKey)}</div>
                <div className="text-xs text-slate-500">{t(item.descKey)}</div>
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
    mainBody = <SettingsAppearancePanel />;
  } else {
    mainBody = <SettingsComingSoonBody />;
  }

  return (
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
        className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-[620px] w-[980px] -translate-x-1/2 -translate-y-1/2 rounded-[44px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.22),rgba(255,255,255,0)_68%)]"
      />

      {/*
        宽度：视口与 920px 取小；高度：min(620px, 100vh-5rem) 作「关于」类短页基准，不随 tab 变高；长内容仅在右侧 scrollbar-none 区域滚动。
      */}
      <div className="relative z-10 flex w-full min-w-0 justify-center">
        <div className="flex h-[min(620px,calc(100vh-5rem))] max-h-[calc(100vh-5rem)] w-[min(920px,calc(100vw-4rem))] max-w-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-white/55 bg-white/90 shadow-[0_30px_90px_rgba(2,6,23,0.5),0_12px_32px_rgba(15,23,42,0.38)] backdrop-blur-xl">
          <div className="grid h-full min-h-0 min-w-0 flex-1 grid-cols-[250px_minmax(0,1fr)] grid-rows-1">
            <aside className="flex h-full min-h-0 flex-col overflow-y-auto border-r border-slate-200/65 bg-white/58 px-4 py-5 scrollbar-none">
            <div className="mb-4 px-2 text-lg font-semibold text-slate-800">{t("settings.title")}</div>
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
                      active ? "bg-slate-900/8 text-slate-900" : "text-slate-700 hover:bg-slate-900/5"
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
            <div className="flex min-w-0 shrink-0 items-center gap-3 border-b border-slate-200/65 px-6 py-4">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  readOnly
                  value=""
                  placeholder={t("settings.searchPlaceholder")}
                  className="w-full rounded-xl border border-slate-200 bg-white/70 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none"
                />
              </div>
              <button
                type="button"
                data-testid="settings-modal-close"
                aria-label={t("settings.close")}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-900/5 hover:text-slate-600"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="scrollbar-none min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
              {mainBody}
            </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
