import type { SiteItem } from "./desktopGridTypes";
import { EditableLabel, Favicon } from "./DesktopGridItemPrimitives";

export function DesktopGridItemSiteBody({
  item,
  isMergeTarget,
  showLabels,
  onRename,
}: {
  item: SiteItem;
  isMergeTarget: boolean;
  showLabels: boolean;
  onRename: (newName: string) => void;
}) {
  return (
    <div
      onClick={() => window.open(item.site.url, "_blank")}
      className="relative flex flex-col items-center justify-center w-full h-full pointer-events-auto cursor-pointer group/site"
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: 28,
          backdropFilter: "blur(10px)",
          background: "rgba(255,255,255,0.4)",
          border: isMergeTarget ? "3px solid #3b82f6" : "1px solid rgba(255,255,255,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isMergeTarget ? "0 0 24px rgba(59, 130, 246, 0.6)" : "0 4px 20px rgba(0,0,0,0.06)",
          transition: "transform 0.2s",
        }}
        className="group-hover/site:scale-[1.03] group-hover/site:bg-white/60 group-active/site:scale-95"
      >
        <Favicon domain={item.site.domain} name={item.site.name} size={52} />
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
