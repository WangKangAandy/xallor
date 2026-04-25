import { AppMessageDialogs } from "../components/AppMessageDialogs";
import { SettingsSpotlightModal } from "../components/SettingsSpotlightModal";
import { useAppI18n } from "../i18n/AppI18n";
import type { AppOverlayLayerBundle } from "../useAppContentController";

export type AppOverlayLayerProps = AppOverlayLayerBundle;

export function AppOverlayLayer({
  settingsState,
  settingsActions,
  appMessage,
  clearMessage,
  openSettingsPrivacy,
  resolveFolderHideConfirm,
  desktopBackgroundMenuPortal,
  onSettingsActiveSectionChange,
}: AppOverlayLayerProps) {
  const { t } = useAppI18n();
  return (
    <>
      {/* 可扩展保留层：未来电子宠物等可放在该层并在小憩状态保持可见/可交互。 */}
      <div className="pointer-events-none absolute inset-0 z-20" aria-hidden />
      <SettingsSpotlightModal
        {...settingsState}
        {...settingsActions}
        onActiveSectionChange={onSettingsActiveSectionChange}
      />

      <AppMessageDialogs
        appMessage={appMessage}
        gotItLabel={t("app.gotIt")}
        goToPrivacySecurityLabel={t("app.goToPrivacySecurity")}
        closeAriaLabel={t("settings.close")}
        onDismissAlert={clearMessage}
        onDismissGoToPrivacy={clearMessage}
        onConfirmGoToPrivacy={() => {
          clearMessage();
          openSettingsPrivacy();
        }}
        onResolveFolderConfirm={resolveFolderHideConfirm}
      />
      {desktopBackgroundMenuPortal}
    </>
  );
}
