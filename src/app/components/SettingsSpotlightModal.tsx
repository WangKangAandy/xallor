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

export function SettingsSpotlightModal({
  open,
  onClose,
  layoutMode,
  onLayoutModeChange,
  openLinksInNewTab,
  onOpenLinksInNewTabChange,
}: SettingsSpotlightModalProps) {
  const { locale, setLocale, t } = useAppI18n();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-6 md:p-10"
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

      <div className="relative z-10 w-full max-w-[980px] overflow-hidden rounded-[24px] border border-white/55 bg-white/90 shadow-[0_30px_90px_rgba(2,6,23,0.5),0_12px_32px_rgba(15,23,42,0.38)] backdrop-blur-xl">
        <div className="grid min-h-[560px] grid-cols-[250px_1fr]">
          <aside className="border-r border-slate-200/65 bg-white/58 px-4 py-5">
            <div className="mb-4 px-2 text-lg font-semibold text-slate-800">{t("settings.title")}</div>
            <nav className="space-y-1">
              {SECTIONS.map(({ id, labelKey, Icon }) => {
                const active = id === "general";
                return (
                  <button
                    key={id}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      active ? "bg-slate-900/8 text-slate-900" : "text-slate-700 hover:bg-slate-900/5"
                    }`}
                  >
                    <Icon className="h-4 w-4 opacity-85" />
                    <span>{t(labelKey)}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="relative flex flex-col">
            <div className="flex items-center gap-3 border-b border-slate-200/65 px-6 py-4">
              <div className="relative flex-1">
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

            <div className="space-y-6 px-6 py-6 text-slate-800">
              <header>
                <h2 className="text-base font-semibold">{t("settings.general")}</h2>
              </header>

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
          </section>
        </div>
      </div>
    </div>
  );
}
