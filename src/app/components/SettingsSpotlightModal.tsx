import {
  Boxes,
  Globe,
  Image,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAppI18n } from "../i18n/AppI18n";
import type { LayoutMode, MinimalDockMode } from "../preferences";
import { isMinimalDockEnabled, useUiPreferences } from "../preferences";
import {
  getAllSearchEngines,
  getSearchEngineById,
  resolveSearchEngineId,
  type SearchEngine,
} from "../search/searchEngineRegistry";
import type { SiteItem } from "./desktopGridTypes";
import { GlassMessageDialog } from "./shared/GlassMessageDialog";
import { useOpenExternalUrl } from "../navigation";
import { loadSearchPayload } from "../storage/repository";
import { useDismissOnPointerDownOutside } from "./useDismissOnPointerDownOutside";
import type { AddIconSubmitPayload } from "./addIcon";
import {
  SettingsAccountPanel,
  SettingsAboutPanel,
  SettingsAppearancePanel,
  SettingsComingSoonBody,
  SettingsGeneralPanel,
  SettingsPrivacyPanel,
  SettingsSitesAndComponentsPanel,
  SettingsWallpaperPanel,
} from "./SettingsSpotlightPanels";
import { useHiddenSpaceDialogController } from "./useHiddenSpaceDialogController";
import { type SettingsSectionId, useSettingsSectionRouting } from "./useSettingsSectionRouting";
import { SettingsHiddenSpaceDialog } from "./SettingsHiddenSpaceDialog";

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
  onAddItemFromSettings: (payload: AddIconSubmitPayload) => void;
  isMinimalMode: boolean;
  minimalDockMode: MinimalDockMode;
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
const SETTINGS_MAIN_BODY_CLASS = "min-w-0 max-w-full space-y-6 px-6 pb-6 pt-1.5 text-slate-800 dark:text-slate-100";

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
  onAddItemFromSettings,
  isMinimalMode,
  minimalDockMode,
  folderHintResetVisible = false,
  onResetFolderHint,
}: SettingsSpotlightModalProps) {
  const { locale, setLocale, t } = useAppI18n();
  const { selectedSearchEngineId, setSearchEngine, sidebarLayout, setSidebarLayout } = useUiPreferences();
  const [searchEnginePickerOpen, setSearchEnginePickerOpen] = useState(false);
  const {
    activeSection,
    setActiveSection,
    settingsSearchQuery,
    setSettingsSearchQuery,
    isSettingsSearchNoResult,
  } = useSettingsSectionRouting({
    open,
    initialSection,
    onSearchNavigates: () => setSearchEnginePickerOpen(false),
  });
  const [selectedHiddenIds, setSelectedHiddenIds] = useState<Set<string>>(new Set());
  const [isHiddenEditing, setIsHiddenEditing] = useState(false);
  const [hiddenDeleteConfirmOpen, setHiddenDeleteConfirmOpen] = useState(false);
  const [availableSearchEngines, setAvailableSearchEngines] = useState<SearchEngine[]>(() => getAllSearchEngines());
  const searchEnginePickerRef = useRef<HTMLDivElement | null>(null);
  const openExternalUrl = useOpenExternalUrl();
  const {
    dialog,
    setDialog,
    passwordDraft,
    setPasswordDraft,
    passwordConfirmDraft,
    setPasswordConfirmDraft,
    verifyPasswordDraft,
    setVerifyPasswordDraft,
    passwordError,
    resetAll: resetHiddenDialogState,
    requestToggleHiddenSpace,
    requestOpenHiddenPanel,
    cancelEnable,
    submitEnable,
    cancelVerify,
    submitVerify,
    cancelConfirmDisable,
    submitConfirmDisable,
  } = useHiddenSpaceDialogController({
    onEnableHiddenSpace,
    onDisableHiddenSpace,
    onVerifyHiddenPassword,
    onVerifiedOpenPanel: () => {
      setIsHiddenEditing(false);
      setSelectedHiddenIds(new Set());
    },
    onDisableConfirmed: () => {
      setSelectedHiddenIds(new Set());
    },
  });
  useDismissOnPointerDownOutside(searchEnginePickerRef, searchEnginePickerOpen, () => {
    setSearchEnginePickerOpen(false);
  });

  useEffect(() => {
    if (activeSection === "privacy") return;
    setIsHiddenEditing(false);
    setSelectedHiddenIds(new Set());
    setHiddenDeleteConfirmOpen(false);
    resetHiddenDialogState();
  }, [activeSection, resetHiddenDialogState]);

  useEffect(() => {
    if (open) return;
    setIsHiddenEditing(false);
    setSelectedHiddenIds(new Set());
    setHiddenDeleteConfirmOpen(false);
    resetHiddenDialogState();
  }, [open, resetHiddenDialogState]);
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

  const handleToggleHiddenSelectAll = () => {
    if (selectedHiddenIds.size === hiddenItems.length) {
      setSelectedHiddenIds(new Set());
      return;
    }
    setSelectedHiddenIds(new Set(hiddenItems.map((item) => item.id)));
  };

  const handleToggleHiddenEditing = () => {
    if (isHiddenEditing) {
      setIsHiddenEditing(false);
      setSelectedHiddenIds(new Set());
      return;
    }
    setIsHiddenEditing(true);
  };

  const handleCollapseHiddenPanel = () => {
    setDialog("none");
    setIsHiddenEditing(false);
    setSelectedHiddenIds(new Set());
  };

  if (!open) return null;

  let mainBody: ReactNode;
  if (activeSection === "account") {
    mainBody = <SettingsAccountPanel mainBodyClassName={SETTINGS_MAIN_BODY_CLASS} />;
  } else if (activeSection === "general") {
    mainBody = (
      <SettingsGeneralPanel
        mainBodyClassName={SETTINGS_MAIN_BODY_CLASS}
        locale={locale}
        setLocale={setLocale}
        selectedSearchEngine={selectedSearchEngine ?? null}
        availableSearchEngines={availableSearchEngines}
        searchEnginePickerOpen={searchEnginePickerOpen}
        setSearchEnginePickerOpen={setSearchEnginePickerOpen}
        onSelectSearchEngine={setSearchEngine}
        openLinksInNewTab={openLinksInNewTab}
        onOpenLinksInNewTabChange={onOpenLinksInNewTabChange}
        isMinimalMode={isMinimalMode}
        sidebarLayout={sidebarLayout}
        setSidebarLayout={setSidebarLayout}
        searchEnginePickerRef={searchEnginePickerRef}
        toggles={TOGGLES}
      />
    );
  } else if (activeSection === "appearance") {
    mainBody = (
      <SettingsAppearancePanel
        mainBodyClassName={SETTINGS_MAIN_BODY_CLASS}
        layoutMode={layoutMode}
        onLayoutModeChange={onLayoutModeChange}
      />
    );
  } else if (activeSection === "wallpaper") {
    mainBody = <SettingsWallpaperPanel mainBodyClassName={SETTINGS_MAIN_BODY_CLASS} />;
  } else if (activeSection === "widgets") {
    mainBody = (
      <SettingsSitesAndComponentsPanel
        onConfirmAdd={onAddItemFromSettings}
        isMinimalMode={isMinimalMode}
        minimalDockVisible={isMinimalDockEnabled(minimalDockMode)}
      />
    );
  } else if (activeSection === "privacy") {
    mainBody = (
      <SettingsPrivacyPanel
        mainBodyClassName={SETTINGS_MAIN_BODY_CLASS}
        hiddenSpaceEnabled={hiddenSpaceEnabled}
        hiddenItems={hiddenItems}
        dialog={dialog}
        isHiddenEditing={isHiddenEditing}
        selectedHiddenIds={selectedHiddenIds}
        isMinimalMode={isMinimalMode}
        minimalDockMode={minimalDockMode}
        folderHintResetVisible={folderHintResetVisible}
        onResetFolderHint={onResetFolderHint}
        onRequestToggleHiddenSpace={() => requestToggleHiddenSpace(hiddenSpaceEnabled)}
        onRequestOpenHiddenPanel={requestOpenHiddenPanel}
        onToggleSelectAll={handleToggleHiddenSelectAll}
        onToggleEditing={handleToggleHiddenEditing}
        onCollapsePanel={handleCollapseHiddenPanel}
        onHiddenItemClick={(item, e) => {
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
        onRestoreSelected={() => onRestoreHiddenItems(hiddenItems.filter((item) => selectedHiddenIds.has(item.id)))}
        onOpenDeleteConfirm={() => setHiddenDeleteConfirmOpen(true)}
      />
    );
  } else if (activeSection === "about") {
    mainBody = <SettingsAboutPanel mainBodyClassName={SETTINGS_MAIN_BODY_CLASS} />;
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
                  value={settingsSearchQuery}
                  onChange={(e) => setSettingsSearchQuery(e.target.value)}
                  placeholder={t("settings.searchPlaceholder")}
                  className="w-full rounded-xl border border-slate-200 bg-white/70 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200 dark:placeholder:text-slate-500"
                />
                {settingsSearchQuery ? (
                  <button
                    type="button"
                    aria-label={t("settings.clearSearch")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-900/5 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-300"
                    onClick={() => setSettingsSearchQuery("")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
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
            <div className="flex min-w-0 shrink-0 items-center justify-end gap-3 pl-6 pr-2 pt-2 pb-2">
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
              {isSettingsSearchNoResult ? (
                <div className="flex min-h-full min-w-0 flex-col items-center justify-center px-6 py-20 text-center">
                  <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{t("settings.searchNoResult")}</p>
                </div>
              ) : (
                mainBody
              )}
            </div>
            <SettingsHiddenSpaceDialog
              dialog={dialog}
              passwordDraft={passwordDraft}
              setPasswordDraft={setPasswordDraft}
              passwordConfirmDraft={passwordConfirmDraft}
              setPasswordConfirmDraft={setPasswordConfirmDraft}
              verifyPasswordDraft={verifyPasswordDraft}
              setVerifyPasswordDraft={setVerifyPasswordDraft}
              passwordError={passwordError}
              onSubmitEnable={submitEnable}
              onCancelEnable={cancelEnable}
              onSubmitVerify={submitVerify}
              onCancelVerify={cancelVerify}
              onSubmitConfirmDisable={submitConfirmDisable}
              onCancelConfirmDisable={cancelConfirmDisable}
            />
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
