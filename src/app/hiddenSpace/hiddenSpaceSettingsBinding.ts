import type { SiteItem } from "../components/desktopGridTypes";

/**
 * 设置弹层 / 桌面桥接所需的隐私空间能力子集。
 * 与 `useHiddenSpace()` 返回值对齐，避免在 `useSettingsSpotlightBindings` 与 `useSettingsDesktopIntegration` 各写一份导致漂移。
 */
export type HiddenSpaceSettingsBinding = {
  isEnabled: boolean;
  hiddenItems: SiteItem[];
  isDev: boolean;
  enableWithPassword: (password: string) => Promise<void>;
  verifyPassword: (password: string) => Promise<boolean>;
  clearAllAndDisable: () => void;
  removeHiddenItemsByIds: (ids: string[]) => void;
  resetFolderWarnedInDev: () => void;
};
