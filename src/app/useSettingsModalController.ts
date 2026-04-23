import { useCallback, useState } from "react";
import type { SettingsSectionId } from "./components/useSettingsSectionRouting";

/** 打开设置时传入的初始分区；`undefined` 表示由 `useSettingsSectionRouting` 默认落到 general。 */
export type AppSettingsInitialSection = SettingsSectionId | undefined;

export function useSettingsModalController() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState<AppSettingsInitialSection>(undefined);

  /** 统一入口：深链/背景菜单等优先用此函数，避免与 `SettingsSectionId` 分叉的第二套 API。 */
  const openSettingsAt = useCallback((section?: SettingsSectionId) => {
    setSettingsInitialSection(section);
    setIsSettingsOpen(true);
  }, []);

  const openSettingsDefault = useCallback(() => {
    openSettingsAt(undefined);
  }, [openSettingsAt]);

  const openSettingsPrivacy = useCallback(() => {
    openSettingsAt("privacy");
  }, [openSettingsAt]);

  const openSettingsWidgets = useCallback(() => {
    openSettingsAt("widgets");
  }, [openSettingsAt]);
  const openSettingsWallpaper = useCallback(() => {
    openSettingsAt("wallpaper");
  }, [openSettingsAt]);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  return {
    isSettingsOpen,
    settingsInitialSection,
    openSettingsAt,
    openSettingsDefault,
    openSettingsPrivacy,
    openSettingsWidgets,
    openSettingsWallpaper,
    closeSettings,
  };
}
