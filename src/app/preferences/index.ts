export type { LayoutCapabilities, LayoutMode } from "./layoutTypes";
export { getLayoutCapabilities } from "./layoutCapabilities";
export {
  parseStoredLayoutMode,
  parseStoredOpenLinksInNewTab,
  UI_LAYOUT_STORAGE_KEY,
  UI_OPEN_LINKS_IN_NEW_TAB_STORAGE_KEY,
  UiPreferencesProvider,
  useUiPreferences,
} from "./useUiPreferences";
export type { UiPreferencesContextValue } from "./useUiPreferences";
