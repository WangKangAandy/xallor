import { useEffect, useMemo, useState } from "react";
import { matchSettingsSection, normalizeSettingsSearchQuery } from "./settingsSearch";

export type SettingsSectionId = "account" | "general" | "appearance" | "wallpaper" | "widgets" | "privacy" | "about";

type UseSettingsSectionRoutingParams = {
  open: boolean;
  initialSection?: SettingsSectionId;
  onSearchNavigates?: () => void;
};

export function useSettingsSectionRouting({ open, initialSection, onSearchNavigates }: UseSettingsSectionRoutingParams) {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("general");
  const [settingsSearchQuery, setSettingsSearchQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setActiveSection(initialSection ?? "general");
    setSettingsSearchQuery("");
  }, [open, initialSection]);

  const normalizedSettingsSearchQuery = useMemo(() => normalizeSettingsSearchQuery(settingsSearchQuery), [settingsSearchQuery]);
  const matchedSettingsSection = useMemo(
    () => matchSettingsSection(normalizedSettingsSearchQuery),
    [normalizedSettingsSearchQuery],
  );
  const isSettingsSearchNoResult = normalizedSettingsSearchQuery.length > 0 && !matchedSettingsSection;

  useEffect(() => {
    if (!open) return;
    if (!normalizedSettingsSearchQuery) return;
    onSearchNavigates?.();
    if (matchedSettingsSection && matchedSettingsSection !== activeSection) {
      setActiveSection(matchedSettingsSection);
    }
  }, [open, normalizedSettingsSearchQuery, matchedSettingsSection, activeSection, onSearchNavigates]);

  return {
    activeSection,
    setActiveSection,
    settingsSearchQuery,
    setSettingsSearchQuery,
    isSettingsSearchNoResult,
  };
}
