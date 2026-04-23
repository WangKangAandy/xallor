/**
 * 下列文案键仍保留在 `messages.ts`（路线图或未接线 UI），此处列出字面量以满足
 * `scripts/validate-i18n.mjs` 对「源码中带引号引用」的扫描；勿在业务组件中依赖本导出。
 */
export const MESSAGE_KEYS_REFERENCED_FOR_I18N_VALIDATE_ONLY = [
  "settings.appearanceAutoDimWallpaper",
  "settings.appearanceAutoDimWallpaperDesc",
  "settings.appearanceBlurStrength",
  "settings.appearanceGlassEffect",
  "settings.appearanceGlassEffectDesc",
  "settings.appearanceIconShape",
  "settings.appearanceIconShapeLarge",
  "settings.appearanceIconShapeMedium",
  "settings.appearanceLayoutSection",
  "settings.appearanceShowSearchBar",
  "settings.appearanceShowSearchBarDesc",
  "settings.appearanceWallpaperBlur",
  "settings.appearanceWallpaperBlurDesc",
  "settings.gridModeConfigDesc",
  "settings.gridModeConfigTitle",
  "settings.layoutGridLockedInMinimal",
  "settings.minimalModeConfigDesc",
  "settings.minimalModeConfigTitle",
  "settings.newTab",
  "settings.searchEngine",
  "settings.sitesComponentsPlaceholderDesc",
  "settings.sitesComponentsPlaceholderTitle",
] as const;
