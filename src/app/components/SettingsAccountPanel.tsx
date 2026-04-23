import type { ReactNode } from "react";
import { Cloud, Database, LockKeyhole, UserRound } from "lucide-react";
import { useAppI18n } from "../i18n/AppI18n";

type AccountSummaryModel = {
  displayName: string;
  email: string;
  userId: string;
  phone: string;
  currentDevice: string;
  syncedSitesCount: number;
  wallpaperCount: number;
  linkedDevicesCount: number;
  lastSyncedAt: string;
};

type AccountPanelModel = {
  summary: AccountSummaryModel;
  isCloudSyncEnabled: boolean;
};

const MOCK_ACCOUNT_PANEL_MODEL: AccountPanelModel = {
  summary: {
    displayName: "WangKang",
    email: "wangkang@example.com",
    userId: "WK_20240420_001",
    phone: "138 8888 8888",
    currentDevice: "Windows / Edge",
    syncedSitesCount: 86,
    wallpaperCount: 128,
    linkedDevicesCount: 3,
    lastSyncedAt: "09:42",
  },
  isCloudSyncEnabled: true,
};

type SettingsAccountPanelProps = {
  mainBodyClassName: string;
  model?: AccountPanelModel;
};

function AccountInfoRow({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 py-2.5 last:border-b-0 dark:border-slate-600/60">
      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm text-slate-900 dark:text-slate-100">{value}</span>
        {suffix ? <span className="shrink-0 text-xs text-emerald-600 dark:text-emerald-300">{suffix}</span> : null}
      </div>
    </div>
  );
}

function AccountSectionCard({
  icon,
  title,
  rows,
  testId,
}: {
  icon: ReactNode;
  title: string;
  rows: Array<{ label: string; value: string; suffix?: string }>;
  testId: string;
}) {
  return (
    <div
      data-testid={testId}
      className="space-y-2 rounded-2xl border border-slate-200/70 bg-white/72 p-4 dark:border-slate-600/60 dark:bg-slate-800/75"
    >
      <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
        {icon}
        <span>{title}</span>
      </div>
      <div className="space-y-0.5">
        {rows.map((row) => (
          <AccountInfoRow key={`${row.label}-${row.value}`} label={row.label} value={row.value} suffix={row.suffix} />
        ))}
      </div>
    </div>
  );
}

export function SettingsAccountPanel({ mainBodyClassName, model = MOCK_ACCOUNT_PANEL_MODEL }: SettingsAccountPanelProps) {
  const { t } = useAppI18n();
  const { summary } = model;

  return (
    <div className={`${mainBodyClassName} pt-0`} data-testid="settings-account-panel">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white/72 p-5 dark:border-slate-600/60 dark:bg-slate-800/75">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
            <UserRound className="h-8 w-8" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-3xl/none font-semibold text-slate-900 dark:text-slate-100">{summary.displayName}</div>
            <div className="truncate text-base text-slate-500 dark:text-slate-400">{summary.email}</div>
            <div className="mt-1 text-sm text-emerald-600 dark:text-emerald-300">{t("settings.accountSignedIn")}</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white/85 px-4 py-2 text-sm text-slate-700 shadow-sm transition-colors hover:bg-white dark:border-slate-600 dark:bg-slate-700/90 dark:text-slate-100 dark:hover:bg-slate-600/90"
          >
            {t("settings.accountEditProfile")}
          </button>
          <button
            type="button"
            className="rounded-lg border border-red-200 bg-red-50/90 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-100/90 dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-200"
          >
            {t("settings.accountSignOut")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AccountSectionCard
          testId="settings-account-basic-info"
          icon={<UserRound className="h-4 w-4 text-sky-600 dark:text-sky-300" />}
          title={t("settings.accountSectionBasicInfo")}
          rows={[
            { label: t("settings.accountPhone"), value: summary.phone, suffix: t("settings.accountBound") },
            { label: t("settings.accountEmail"), value: summary.email, suffix: t("settings.accountVerified") },
            { label: t("settings.accountUserId"), value: summary.userId },
          ]}
        />

        <AccountSectionCard
          testId="settings-account-sync-backup"
          icon={<Cloud className="h-4 w-4 text-sky-600 dark:text-sky-300" />}
          title={t("settings.accountSectionSyncBackup")}
          rows={[
            {
              label: t("settings.accountCloudSync"),
              value: model.isCloudSyncEnabled ? t("settings.accountEnabled") : t("settings.accountDisabled"),
            },
            { label: t("settings.accountLastSyncAt"), value: summary.lastSyncedAt },
            { label: t("settings.accountCurrentDevice"), value: summary.currentDevice },
          ]}
        />

        <AccountSectionCard
          testId="settings-account-security"
          icon={<LockKeyhole className="h-4 w-4 text-sky-600 dark:text-sky-300" />}
          title={t("settings.accountSectionSecurity")}
          rows={[
            { label: t("settings.accountLoginPassword"), value: t("settings.accountConfigured") },
            { label: t("settings.accountTwoFactor"), value: t("settings.accountNotEnabled") },
            { label: t("settings.accountDeviceManagement"), value: `${summary.linkedDevicesCount} ${t("settings.accountDevices")}` },
          ]}
        />

        <AccountSectionCard
          testId="settings-account-preferences-data"
          icon={<Database className="h-4 w-4 text-sky-600 dark:text-sky-300" />}
          title={t("settings.accountSectionPreferencesData")}
          rows={[
            { label: t("settings.accountThemeFollowsSystem"), value: t("settings.accountEnabled") },
            { label: t("settings.accountSyncedWallpapers"), value: `${summary.wallpaperCount} ${t("settings.accountItems")}` },
            { label: t("settings.accountSyncedSites"), value: `${summary.syncedSitesCount} ${t("settings.accountItems")}` },
          ]}
        />
      </div>
    </div>
  );
}
