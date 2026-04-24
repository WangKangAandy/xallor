import { useMemo, useState } from "react";
import { HoverRevealGlassAddTile } from "../components/addIcon/HoverRevealGlassAddTile";
import { FaviconIcon } from "../components/shared/FaviconIcon";
import { useAppI18n } from "../i18n/AppI18n";
import { useOpenExternalUrl } from "../navigation";
import type { MinimalDockEntry, MinimalDockSiteEntry } from "./minimalDockTypes";
import { MINIMAL_DOCK_MAX_SLOTS } from "./minimalDockConstants";

type MinimalDockBarProps = {
  entries: MinimalDockEntry[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onOpenWidgets: () => void;
};

const SLOT_CLASS =
  "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/12 shadow-sm backdrop-blur-md transition-transform hover:scale-[1.04] hover:bg-white/18 dark:border-white/12 dark:bg-slate-900/55 dark:hover:bg-slate-800/65";

/** 仅站点：与右侧悬停「+」分离，胶囊可相对视口居中。 */
const CAPSULE_CLASS =
  "flex items-center justify-center gap-2.5 rounded-2xl border border-white/30 bg-white/20 py-3 pl-4 pr-4 shadow-[0_16px_48px_-16px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-white/12 dark:bg-slate-900/50";

const DOCK_ADD_PX = 56;

export function MinimalDockBar({ entries, onReorder, onOpenWidgets }: MinimalDockBarProps) {
  const { t } = useAppI18n();
  const openExternalUrl = useOpenExternalUrl();
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const siteEntries = useMemo(
    () => entries.filter((e): e is MinimalDockSiteEntry => e.kind === "site"),
    [entries],
  );

  const isDockFull = siteEntries.length >= MINIMAL_DOCK_MAX_SLOTS;
  const showAddCell = !isDockFull;

  const addTile = showAddCell ? (
    <div data-testid="minimal-dock-add-outer" className="pointer-events-auto shrink-0">
      <HoverRevealGlassAddTile
        onOpenAdd={onOpenWidgets}
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
          {siteEntries.map((entry, index) => (
            <button
              key={entry.id}
              type="button"
              draggable
              aria-label={entry.site.name}
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex === null || dragIndex === index) return;
                onReorder(dragIndex, index);
                setDragIndex(null);
              }}
              onClick={(e) => openExternalUrl(entry.site.url, e)}
              className={SLOT_CLASS}
            >
              <FaviconIcon domain={entry.site.domain} name={entry.site.name} size={40} />
            </button>
          ))}
        </div>
        {addTile ? <div className="absolute left-full top-1/2 ml-2.5 -translate-y-1/2">{addTile}</div> : null}
      </div>
    </div>
  );
}
