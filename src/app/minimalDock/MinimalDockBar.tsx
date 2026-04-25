import { useMemo } from "react";
import { HoverRevealGlassAddTile } from "../components/addIcon/HoverRevealGlassAddTile";
import { useAppI18n } from "../i18n/AppI18n";
import type { MinimalDockEntry, MinimalDockSiteEntry } from "./minimalDockTypes";
import { MinimalDockSiteSlot } from "./MinimalDockSiteSlot";

type MinimalDockBarProps = {
  entries: MinimalDockEntry[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onOpenWidgets: () => void;
  isCustomContextMenuEnabled?: boolean;
  onDockSiteDelete?: (dockEntryId: string) => void;
  onDockSiteHide?: (dockEntryId: string) => void | Promise<void>;
  onDockEnterArrangeMode?: () => void;
};

const SLOT_CLASS =
  "relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/12 shadow-sm backdrop-blur-md transition-transform hover:scale-[1.04] hover:bg-white/18 dark:border-white/12 dark:bg-slate-900/55 dark:hover:bg-slate-800/65";

/** 仅站点：与右侧悬停「+」分离，胶囊可相对视口居中。 */
const CAPSULE_CLASS =
  "pointer-events-auto relative flex items-center justify-center gap-2.5 rounded-2xl border border-white/30 bg-white/20 py-3 pl-4 pr-4 shadow-[0_16px_48px_-16px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-white/12 dark:bg-slate-900/50";

const DOCK_ADD_PX = 56;

export function MinimalDockBar({
  entries,
  onReorder,
  onOpenWidgets,
  isCustomContextMenuEnabled = true,
  onDockSiteDelete,
  onDockSiteHide,
  onDockEnterArrangeMode,
}: MinimalDockBarProps) {
  const { t } = useAppI18n();

  const siteEntries = useMemo(
    () => entries.filter((e): e is MinimalDockSiteEntry => e.kind === "site"),
    [entries],
  );

  // 即使 Dock 满槽，也保留「+」悬停入口，保持交互一致（点击后由上层给出满槽反馈）。
  const showAddCell = true;

  const addTile = showAddCell ? (
    <div data-testid="minimal-dock-add-outer" className="pointer-events-auto shrink-0">
      <HoverRevealGlassAddTile
        onOpenAdd={onOpenWidgets}
        // 规则：空 Dock（无站点）时常显「+」；有站点时回到 hover 渐显。
        alwaysVisible={siteEntries.length === 0}
        hoverGroup="dock-add"
        sizePx={DOCK_ADD_PX}
        tileRoundedClass="!rounded-xl"
        plusClassName="h-7 w-7"
        ariaLabel={t("minimalDock.addSite")}
      />
    </div>
  ) : null;

  if (siteEntries.length === 0) {
    return (
      <div className="flex justify-center" data-testid="minimal-dock-bar">
        {addTile}
      </div>
    );
  }

  return (
    <div
      className="flex w-full max-w-[min(92vw,640px)] items-center justify-center pointer-events-none"
      data-testid="minimal-dock-bar"
    >
      <div className="relative inline-flex items-center justify-center">
        <div className={CAPSULE_CLASS} data-testid="minimal-dock-capsule">
          <span
            aria-hidden
            data-testid="minimal-dock-capsule-breath-ring"
            className="pointer-events-none absolute inset-0 z-0 rounded-2xl border border-white/30 bg-white/20 opacity-80 backdrop-blur-xl dark:border-white/12 dark:bg-slate-900/50"
          />
          {siteEntries.map((entry, index) => (
            <MinimalDockSiteSlot
              key={entry.id}
              entry={entry}
              index={index}
              slotClassName={SLOT_CLASS}
              onReorder={onReorder}
              isCustomContextMenuEnabled={isCustomContextMenuEnabled}
              onDockSiteDelete={onDockSiteDelete}
              onDockSiteHide={onDockSiteHide}
              onDockEnterArrangeMode={onDockEnterArrangeMode}
            />
          ))}
        </div>
        {addTile ? <div className="absolute left-full top-1/2 ml-2.5 -translate-y-1/2">{addTile}</div> : null}
      </div>
    </div>
  );
}
