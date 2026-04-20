import {
  Bell,
  Boxes,
  Globe,
  MonitorCog,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { DEFAULT_NEW_TAB_BACKGROUND_URL } from "./feedback";
import { useAppI18n, type AppLocale } from "../i18n/AppI18n";
import type { LayoutMode } from "../preferences";
import { useUiPreferences } from "../preferences";
import { SegmentedControl } from "./shared/SegmentedControl";
import {
  getAllSearchEngines,
  getSearchEngineById,
  resolveSearchEngineId,
} from "../search/searchEngineRegistry";
import type { SiteItem } from "./desktopGridTypes";
import { Favicon } from "./DesktopGridItemPrimitives";
import { GlassMessageDialog } from "./shared/GlassMessageDialog";
import { useOpenExternalUrl } from "../navigation";

type SettingsSpotlightModalProps = {
  open: boolean;
  onClose: () => void;
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

/** 设置右侧主内容区统一容器样式：集中维护间距与文本色。 */
const SETTINGS_MAIN_BODY_CLASS = "min-w-0 max-w-full space-y-6 px-6 pb-6 pt-1 text-slate-800 dark:text-slate-100";

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
  const { colorScheme, setColorScheme } = useUiPreferences();
  const [wallpaperBlur, setWallpaperBlur] = useState(true);
  const [autoDimWallpaper, setAutoDimWallpaper] = useState(true);
  const [blurStrength, setBlurStrength] = useState(42);
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [iconSize, setIconSize] = useState(58);
  const [iconShape, setIconShape] = useState<"medium" | "large">("medium");
  const [glassEffect, setGlassEffect] = useState(true);

  return (
    <div className={SETTINGS_MAIN_BODY_CLASS}>
      <div className="min-w-0 space-y-4 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/72 p-4 dark:border-slate-600/60 dark:bg-slate-800/75">
        <div className="text-sm font-medium">{t("settings.appearanceTheme")}</div>
        <SegmentedControl<"light" | "dark" | "system">
          value={colorScheme}
          onChange={setColorScheme}
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

      <div className="min-w-0 space-y-4 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/72 p-4 dark:border-slate-600/60 dark:bg-slate-800/75">
        <div className="min-w-0">
          <div className="text-sm font-medium">{t("settings.appearanceWallpaper")}</div>
          <div className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">
            {t("settings.appearanceWallpaperHint")}
          </div>
        </div>
        {/* 固定宽高比容器 + 绝对定位图片：彻底切断 intrinsic 宽度参与布局 */}
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
        <div className="h-px bg-slate-200/70 dark:bg-slate-600/50" />
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

      <div className="min-w-0 space-y-3 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/72 p-4 dark:border-slate-600/60 dark:bg-slate-800/75">
        <div className="text-sm font-medium">{t("settings.appearanceLayoutSection")}</div>
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
        <div className="h-px bg-slate-200/70 dark:bg-slate-600/50" />
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
          <span className="text-sm text-slate-700 dark:text-slate-200">{t("settings.appearanceIconShape")}</span>
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
        <div className="h-px bg-slate-200/70 dark:bg-slate-600/50" />
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
      <p className="max-w-sm text-center text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {t("settings.sectionComingSoon")}
      </p>
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
  const { selectedSearchEngineId, setSearchEngine } = useUiPreferences();
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
  const openExternalUrl = useOpenExternalUrl();

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
  const availableSearchEngines = getAllSearchEngines();
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
          <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div>
              <div className="text-sm font-medium">{t("settings.defaultSearchEngine")}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{t("settings.defaultSearchEngineDesc")}</div>
            </div>
            <button
              type="button"
              data-testid="settings-default-search-engine-trigger"
              className="rounded-lg border border-slate-200 bg-white/85 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-white dark:border-slate-600 dark:bg-slate-700/90 dark:text-slate-200 dark:hover:bg-slate-600/90"
              onClick={() => setSearchEnginePickerOpen((v) => !v)}
            >
              {selectedSearchEngine?.name ?? "百度"}
            </button>
            {searchEnginePickerOpen ? (
              <div
                className="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-[180px] overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl dark:border-slate-600 dark:bg-slate-800/95"
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
                          ? "bg-sky-500/12 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/70"
                      }`}
                      onClick={() => {
                        setSearchEngine(engine.id);
                        setSearchEnginePickerOpen(false);
                      }}
                    >
                      <span>{engine.name}</span>
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
        className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-[620px] w-[980px] -translate-x-1/2 -translate-y-1/2 rounded-[44px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.22),rgba(255,255,255,0)_68%)]"
      />

      {/*
        宽度：视口与 920px 取小；高度：min(620px, 100vh-5rem) 作「关于」类短页基准，不随 tab 变高；长内容仅在右侧 scrollbar-none 区域滚动。
      */}
      <div className="pointer-events-none relative z-10 flex w-full min-w-0 justify-center">
        <div className="pointer-events-auto flex h-[min(620px,calc(100vh-5rem))] max-h-[calc(100vh-5rem)] w-[min(920px,calc(100vw-4rem))] max-w-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-white/55 bg-white/90 shadow-[0_30px_90px_rgba(2,6,23,0.5),0_12px_32px_rgba(15,23,42,0.38)] backdrop-blur-xl dark:border-slate-600/50 dark:bg-slate-900/95">
          <div className="grid h-full min-h-0 min-w-0 flex-1 grid-cols-[250px_minmax(0,1fr)] grid-rows-1">
            <aside className="flex h-full min-h-0 flex-col overflow-y-auto border-r border-slate-200/65 bg-white/58 px-4 py-5 scrollbar-none dark:border-slate-700/80 dark:bg-slate-900/70">
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
