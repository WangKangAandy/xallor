import type { Site } from "../components/desktopGridTypes";

export type MinimalDockSystemActionId = "openSettings" | "openWidgets";

export type MinimalDockSystemEntry = {
  kind: "system";
  id: string;
  actionId: MinimalDockSystemActionId;
};

export type MinimalDockSiteEntry = {
  kind: "site";
  id: string;
  site: Site;
};

export type MinimalDockEntry = MinimalDockSystemEntry | MinimalDockSiteEntry;

export type MinimalDockStored = {
  version: 1;
  entries: MinimalDockEntry[];
};
