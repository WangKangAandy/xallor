import type { ReactNode } from "react";
import { UiPreferencesProvider } from "./useUiPreferences";

/** 单测中渲染依赖 `useOpenExternalUrl` / `useUiPreferences` 的树时使用。 */
export function UiPreferencesTestProvider({ children }: { children: ReactNode }) {
  return <UiPreferencesProvider>{children}</UiPreferencesProvider>;
}
