import { useOpenExternalUrl } from "../navigation";
import type { SiteItem } from "./desktopGridTypes";
import { Favicon } from "./DesktopGridItemPrimitives";
import { GridDesktopCardSurface } from "./GridDesktopCardSurface";
import { GridItemLabel } from "./GridItemLabel";

export function DesktopGridItemSiteBody({
  item,
  isMergeTarget,
  isArrangeMode,
  isArrangeSelected,
  showLabels,
  onRename,
}: {
  item: SiteItem;
  isMergeTarget: boolean;
  isArrangeMode: boolean;
  isArrangeSelected: boolean;
  showLabels: boolean;
  onRename: (newName: string) => void;
}) {
  const openUrl = useOpenExternalUrl();
  const v = item.site.iconVariant ?? 0;
  const invert = v === 1;
  const small = v === 2;
  const placeholder = v === 3;

  return (
    <div
      onClick={(e) => {
        if (isArrangeMode) return;
        openUrl(item.site.url, e);
      }}
      className="relative flex flex-col items-center justify-center w-full h-full pointer-events-auto cursor-pointer group/site"
    >
      <GridDesktopCardSurface
        variant="tile"
        isMergeTarget={isMergeTarget}
        className={
          invert
            ? "flex h-[88px] w-[88px] items-center justify-center !bg-gray-900/92 transition-[transform] duration-200 group-hover/site:scale-[1.03] group-hover/site:!bg-gray-900 group-active/site:scale-95"
            : "flex h-[88px] w-[88px] items-center justify-center transition-[transform] duration-200 group-hover/site:scale-[1.03] group-hover/site:bg-white/60 group-active/site:scale-95"
        }
        style={
          isArrangeMode && isArrangeSelected
            ? {
                boxShadow: "inset 0 0 0 2px rgba(59,130,246,0.95), inset 0 0 0 3px rgba(255,255,255,0.2)",
              }
            : undefined
        }
      >
        {placeholder ? (
          <span className="text-[26px] font-medium leading-none text-gray-500" aria-hidden>
            ···
          </span>
        ) : (
          <Favicon
            domain={item.site.domain}
            name={item.site.name}
            size={small ? 44 : 52}
            iconClassName={invert ? "brightness-0 invert drop-shadow-none" : ""}
          />
        )}
      </GridDesktopCardSurface>
      <GridItemLabel
        placement="bottom"
        editable
        initialName={item.site.name}
        onRename={onRename}
        showLabels={showLabels}
      />
    </div>
  );
}
