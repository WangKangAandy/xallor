import type { SiteItem } from "./desktopGridTypes";
import { SiteTileAddAffordance } from "./addIcon";
import { EditableLabel, Favicon } from "./DesktopGridItemPrimitives";
import { GlassSurface } from "./shared/GlassSurface";

export function DesktopGridItemSiteBody({
  item,
  isMergeTarget,
  showLabels,
  onRename,
  onRequestAdd,
  suppressAddAffordance,
}: {
  item: SiteItem;
  isMergeTarget: boolean;
  showLabels: boolean;
  onRename: (newName: string) => void;
  /** 点击右下角加号时触发；由 DesktopGrid 单例 `AddIconDialog` 承接。 */
  onRequestAdd?: () => void;
  /** 拖拽源格时为 true，隐藏加号角标。 */
  suppressAddAffordance?: boolean;
}) {
  return (
    <div
      onClick={() => window.open(item.site.url, "_blank")}
      className="relative flex flex-col items-center justify-center w-full h-full pointer-events-auto cursor-pointer group/site"
    >
      <div className="relative shrink-0">
        <GlassSurface
          variant="tile"
          rounded="none"
          className="flex h-[88px] w-[88px] items-center justify-center !rounded-[28px] transition-[transform] duration-200 group-hover/site:scale-[1.03] group-hover/site:bg-white/60 group-active/site:scale-95"
          style={
            isMergeTarget
              ? { border: "3px solid #3b82f6", boxShadow: "0 0 24px rgba(59, 130, 246, 0.6)" }
              : undefined
          }
        >
          <Favicon domain={item.site.domain} name={item.site.name} size={52} />
        </GlassSurface>
        {onRequestAdd ? (
          <SiteTileAddAffordance suppress={!!suppressAddAffordance} onPress={() => onRequestAdd()} />
        ) : null}
      </div>
      <EditableLabel
        initialName={item.site.name}
        onRename={onRename}
        showLabels={showLabels}
        className="hover:bg-black/10 px-1 rounded transition-colors"
        style={{
          position: "absolute",
          bottom: -28,
          fontSize: 13,
          color: "rgba(255,255,255,0.95)",
          maxWidth: 100,
          left: "50%",
          transform: "translateX(-50%)",
          textShadow: "0 1px 4px rgba(0,0,0,0.4)",
          fontWeight: 500,
        }}
        inputClassName="placeholder:text-white/60 text-center"
        inputStyle={{
          position: "absolute",
          bottom: -30,
          width: "120%",
          left: "-10%",
          fontSize: 13,
          color: "rgba(255,255,255,0.95)",
          textShadow: "0 1px 4px rgba(0,0,0,0.4)",
          fontWeight: 500,
        }}
      />
    </div>
  );
}
