import { useCallback, useState } from "react";

export type AppSettingsInitialSection = "privacy" | "widgets" | "wallpaper" | undefined;

export function useSettingsModalController() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState<AppSettingsInitialSection>(undefined);

  const openSettings = useCallback((section?: AppSettingsInitialSection) => {
    setSettingsInitialSection(section);
    setIsSettingsOpen(true);
  }, []);

  const openSettingsDefault = useCallback(() => {
    openSettings(undefined);
  }, [openSettings]);

  const openSettingsPrivacy = useCallback(() => {
    openSettings("privacy");
  }, [openSettings]);

  const openSettingsWidgets = useCallback(() => {
    openSettings("widgets");
  }, [openSettings]);
  const openSettingsWallpaper = useCallback(() => {
    openSettings("wallpaper");
  }, [openSettings]);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  return {
    isSettingsOpen,
    settingsInitialSection,
    openSettingsDefault,
    openSettingsPrivacy,
    openSettingsWidgets,
    openSettingsWallpaper,
    closeSettings,
  };
}
