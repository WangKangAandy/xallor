import { useEffect, useState } from "react";
import { Link2, X } from "lucide-react";
import { FaviconIcon } from "../shared/FaviconIcon";
import { LocalFileUploadButton } from "../localUpload/LocalFileUploadButton";
import type { AddIconCatalogEntry } from "./addIconCatalog";
import { useAppI18n } from "../../i18n/AppI18n";
import {
  type AddIconSubmitPayload,
  type AddIconUploadFailureReason,
  type SiteIconVariantId,
  toCustomIconFailureMessageKey,
  normalizeSiteUrlInput,
  safeDomainFromUrl,
} from "./addIconSubmitPayload";

type AddIconPreviewPanelProps = {
  selected: AddIconCatalogEntry | null;
  contextSiteId: string | null;
  onClose: () => void;
  showCloseButton?: boolean;
  /** 添加当前选中项并关闭（名称/网址/图标由面板内草稿与选项决定）。 */
  onAdd: (payload: AddIconSubmitPayload) => void;
};

/** 组件「图样示例」大图预览区；色值见 `theme.css` feature: add-icon */
const PREVIEW_PATTERN_SURFACE =
  "rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] bg-[var(--add-icon-preview-pattern-bg)] border-[color:var(--add-icon-preview-pattern-border)]";

/** 站点顶部预览卡 */
const SITE_PREVIEW_CARD = "rounded-xl border border-border bg-muted/40";

/** 与左侧摘要里「组件」标签同一套深绿底白字。 */
const KIND_TAG_EMERALD = "shrink-0 rounded-md bg-emerald-600/95 px-2 py-0.5 text-[10px] font-medium text-white";

const SITE_NAME_MAX = 30;

const footerPrimaryBtn =
  "rounded-xl border border-border bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-45";

function siteIconOptionClasses(active: boolean, variant: "default" | "dark" | "more") {
  if (active) {
    return "border-2 border-primary ring-2 ring-ring/35";
  }
  if (variant === "more") {
    return "border border-dashed border-border hover:border-muted-foreground/50";
  }
  if (variant === "dark") {
    return "border border-muted-foreground/40 hover:border-muted-foreground/60";
  }
  return "border border-border hover:border-muted-foreground/50";
}

/** 与下方选项行同一套规则，驱动上方预览卡大图/小图。 */
function SitePreviewHeaderIcon(props: {
  variant: SiteIconVariantId;
  domain: string;
  displayName: string;
  customIconDataUrl: string | null;
}) {
  const { variant, domain, displayName, customIconDataUrl } = props;
  if (variant === 3 && !customIconDataUrl) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-muted/50 text-sm font-medium text-muted-foreground">
        ···
      </div>
    );
  }
  if (variant === 3 && customIconDataUrl) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card ring-1 ring-border/60">
        <img src={customIconDataUrl} alt="" className="h-6 w-6 object-contain" width={24} height={24} />
      </div>
    );
  }
  const invert = variant === 1;
  const small = variant === 2;
  const size = small ? 20 : 24;
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-sm ring-1 ${
        invert ? "bg-foreground ring-border" : "bg-card ring-border"
      }`}
    >
      <FaviconIcon
        domain={domain}
        name={displayName}
        size={size}
        className={invert ? "brightness-0 invert" : undefined}
      />
    </div>
  );
}

/** 预览大图区：固定槽尺寸，避免「反色」另加 padding 导致整卡高度与其它选项不一致 */
const SITE_PREVIEW_HERO_SLOT = "flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-2xl";

function SitePreviewHeroIcon(props: {
  variant: SiteIconVariantId;
  domain: string;
  displayName: string;
  customIconDataUrl: string | null;
}) {
  const { variant, domain, displayName, customIconDataUrl } = props;
  if (variant === 3 && !customIconDataUrl) {
    return (
      <div
        className={`${SITE_PREVIEW_HERO_SLOT} border border-dashed border-border bg-muted/50 text-2xl font-medium text-muted-foreground`}
      >
        ···
      </div>
    );
  }
  if (variant === 3 && customIconDataUrl) {
    return (
      <div className={`${SITE_PREVIEW_HERO_SLOT} border border-border bg-card ring-1 ring-border/60`}>
        <img src={customIconDataUrl} alt="" className="h-12 w-12 object-contain" width={48} height={48} />
      </div>
    );
  }
  const invert = variant === 1;
  const small = variant === 2;
  const size = small ? 36 : 48;
  return (
    <div
      className={`${SITE_PREVIEW_HERO_SLOT} shadow-[inset_0_1px_0_rgba(127,127,127,0.14)] ${
        invert ? "bg-foreground shadow-inner" : "bg-transparent"
      }`}
    >
      <FaviconIcon
        domain={domain}
        name={displayName}
        size={size}
        className={invert ? "brightness-0 invert" : undefined}
      />
    </div>
  );
}

/**
 * 右栏：「预览」在卡片外；站点顺序为预览卡 → 名称/网址 → 图标；底部三键。
 */
export function AddIconPreviewPanel({
  selected,
  contextSiteId: _contextSiteId,
  onClose,
  showCloseButton = true,
  onAdd,
}: AddIconPreviewPanelProps) {
  const { t } = useAppI18n();
  const canSubmit = Boolean(selected);

  const [siteDraftName, setSiteDraftName] = useState("");
  const [siteDraftUrl, setSiteDraftUrl] = useState("");
  const [siteIconVariant, setSiteIconVariant] = useState<SiteIconVariantId>(0);
  const [siteCustomIconDataUrl, setSiteCustomIconDataUrl] = useState<string | null>(null);
  const [customIconError, setCustomIconError] = useState<string | null>(null);

  useEffect(() => {
    if (selected?.kind === "site") {
      setSiteDraftName(selected.name);
      setSiteDraftUrl(selected.url);
      setSiteIconVariant(0);
      setSiteCustomIconDataUrl(null);
      setCustomIconError(null);
    }
  }, [selected?.kind, selected?.id]);

  const siteDisplayName = selected?.kind === "site" ? siteDraftName.trim() || selected.name : "";
  const sitePreviewDomain =
    selected?.kind === "site"
      ? safeDomainFromUrl(normalizeSiteUrlInput(siteDraftUrl, selected.url), selected.domain)
      : "";

  const buildSubmitPayload = (): AddIconSubmitPayload | null => {
    if (!selected) return null;
    if (selected.kind === "site") {
      const name = siteDraftName.trim() || selected.name;
      const url = normalizeSiteUrlInput(siteDraftUrl, selected.url);
      const domain = safeDomainFromUrl(url, selected.domain);
      return {
        kind: "site",
        site: {
          name,
          domain,
          url,
          iconVariant: siteIconVariant,
            customIconDataUrl: siteIconVariant === 3 ? (siteCustomIconDataUrl ?? undefined) : undefined,
        },
      };
    }
    return { kind: "component", widgetType: selected.widgetType };
  };

  const handleAddClick = () => {
    const payload = buildSubmitPayload();
    if (payload) onAdd(payload);
  };

  const handleCustomIconUploadError = (reason: AddIconUploadFailureReason) => {
    const key = toCustomIconFailureMessageKey(reason);
    setCustomIconError(key ? t(key) : null);
  };

  return (
    <section
      className="flex h-full min-h-0 w-full min-w-0 shrink flex-col sm:grow-0 sm:shrink sm:basis-[min(288px,42%)] sm:max-w-[min(380px,46%)]"
      aria-label={t("addIcon.preview")}
    >
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-2 sm:px-5 sm:pb-5 sm:pt-2.5">
        <div className="mb-1 flex shrink-0 items-center justify-end gap-2">
          {showCloseButton ? (
            <button
              type="button"
              aria-label={t("addIcon.closeDialog")}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-2 [scrollbar-width:thin]">
            {!selected ? (
              <>
                <p className="text-xs leading-relaxed text-muted-foreground">{t("addIcon.previewHint")}</p>
                <div className="mt-4 flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                  {t("addIcon.unselected")}
                </div>
              </>
            ) : selected.kind === "site" ? (
              <div className="flex min-h-0 flex-col gap-3 pt-0.5">
                <div
                  className={`flex min-h-[104px] flex-col items-stretch justify-center gap-2.5 px-3 py-3 ${SITE_PREVIEW_CARD}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-start gap-2.5">
                      <SitePreviewHeaderIcon
                        variant={siteIconVariant}
                        domain={sitePreviewDomain}
                        displayName={siteDisplayName}
                        customIconDataUrl={siteCustomIconDataUrl}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{siteDraftName || selected.name}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{siteDraftUrl || selected.url}</p>
                      </div>
                    </div>
                    <span className={KIND_TAG_EMERALD}>{t("addIcon.kindSite")}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center border-t border-border pt-3">
                    <SitePreviewHeroIcon
                      variant={siteIconVariant}
                      domain={sitePreviewDomain}
                      displayName={siteDisplayName}
                      customIconDataUrl={siteCustomIconDataUrl}
                    />
                    <p className="mt-2 text-sm font-semibold text-foreground">{siteDraftName || selected.name}</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label htmlFor="add-icon-site-name" className="text-xs font-medium text-muted-foreground">
                      {t("addIcon.fieldName")}
                    </label>
                    <div className="relative mt-1">
                      <input
                        id="add-icon-site-name"
                        type="text"
                        value={siteDraftName}
                        maxLength={SITE_NAME_MAX}
                        onChange={(e) => setSiteDraftName(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-12 text-sm text-foreground outline-none ring-0 transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
                        autoComplete="off"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground">
                        {siteDraftName.length}/{SITE_NAME_MAX}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="add-icon-site-url" className="text-xs font-medium text-muted-foreground">
                      {t("addIcon.fieldUrl")}
                    </label>
                    <div className="relative mt-1">
                      <input
                        id="add-icon-site-url"
                        type="url"
                        value={siteDraftUrl}
                        onChange={(e) => setSiteDraftUrl(e.target.value)}
                        placeholder="https://"
                        className="w-full rounded-lg border border-border bg-background py-2 pl-3 pr-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
                        autoComplete="off"
                      />
                      <Link2
                        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <p id="add-icon-site-icon-label" className="text-xs font-medium text-muted-foreground">
                    {t("addIcon.fieldIcon")}
                  </p>
                  <div
                    className="mt-1.5 flex flex-wrap gap-2"
                    role="radiogroup"
                    aria-labelledby="add-icon-site-icon-label"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={siteIconVariant === 0}
                      aria-label={t("addIcon.iconColor")}
                      onClick={() => setSiteIconVariant(0)}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-card p-1 transition-colors ${siteIconOptionClasses(siteIconVariant === 0, "default")}`}
                    >
                      <FaviconIcon domain={sitePreviewDomain} name={siteDisplayName} size={28} />
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={siteIconVariant === 1}
                      aria-label={t("addIcon.iconInverted")}
                      onClick={() => setSiteIconVariant(1)}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-foreground p-1 hover:bg-foreground/90 ${siteIconOptionClasses(siteIconVariant === 1, "dark")}`}
                    >
                      <FaviconIcon
                        domain={sitePreviewDomain}
                        name={siteDisplayName}
                        size={28}
                        className="brightness-0 invert"
                      />
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={siteIconVariant === 2}
                      aria-label={t("addIcon.iconSmall")}
                      onClick={() => setSiteIconVariant(2)}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-card p-1 ${siteIconOptionClasses(siteIconVariant === 2, "default")}`}
                    >
                      <FaviconIcon domain={sitePreviewDomain} name={siteDisplayName} size={22} />
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={siteIconVariant === 3}
                      aria-label={t("addIcon.iconMore")}
                      onClick={() => setSiteIconVariant(3)}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-lg font-medium text-muted-foreground transition-colors hover:bg-muted ${siteIconOptionClasses(siteIconVariant === 3, "more")}`}
                    >
                      ···
                    </button>
                  </div>
                  {siteIconVariant === 3 ? (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <LocalFileUploadButton
                        className="rounded-lg border border-border bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        onPick={({ dataUrl }) => {
                          setSiteCustomIconDataUrl(dataUrl);
                          setCustomIconError(null);
                        }}
                        onPickError={handleCustomIconUploadError}
                      >
                        {t("addIcon.uploadCustomIcon")}
                      </LocalFileUploadButton>
                      <button
                        type="button"
                        className="rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
                        disabled={!siteCustomIconDataUrl}
                        onClick={() => {
                          setSiteCustomIconDataUrl(null);
                          setCustomIconError(null);
                        }}
                      >
                        {t("addIcon.resetCustomIcon")}
                      </button>
                      {customIconError ? <p className="w-full text-xs text-amber-700">{customIconError}</p> : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-2.5">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center text-2xl leading-none sm:text-[28px]"
                    aria-hidden
                  >
                    {selected.widgetType === "weather" ? "⛅" : "📅"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{t(selected.nameKey)}</p>
                      <span className={KIND_TAG_EMERALD}>{t("addIcon.kindComponent")}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{t(selected.subtitleKey)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t("addIcon.componentSizes")}</p>
                  <div className="mt-2 grid grid-cols-3 gap-1.5 text-center text-[10px] text-muted-foreground">
                    <div className="rounded-lg border border-border bg-muted/40 py-2">{t("addIcon.sizeLarge")}</div>
                    <div className="rounded-lg border border-border bg-muted/40 py-2">{t("addIcon.sizeMedium")}</div>
                    <div className="rounded-lg border border-border bg-muted/40 py-2">{t("addIcon.sizeSmall")}</div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t("addIcon.preview")}</p>
                  <div
                    className={`mt-2 flex min-h-[120px] flex-1 flex-col items-center justify-center p-4 text-[11px] text-[color:var(--add-icon-preview-pattern-text-muted)] ${PREVIEW_PATTERN_SURFACE}`}
                  >
                    <span className="text-3xl" aria-hidden>
                      {selected.widgetType === "weather" ? "⛅" : "📅"}
                    </span>
                    <p className="mt-2 text-xs font-medium text-[color:var(--add-icon-preview-pattern-text)]">
                      {t("addIcon.previewPattern")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 px-4 py-2.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <button type="button" disabled={!canSubmit} className={footerPrimaryBtn} onClick={handleAddClick}>
                {t("addIcon.add")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
