import { DEFAULT_NEW_TAB_BACKGROUND_URL, RemoteBackgroundImage } from "../components/feedback";
import { GlassSurface } from "../components/shared/GlassSurface";

export function AppBackgroundLayer() {
  return (
    <div className="absolute inset-0">
      <RemoteBackgroundImage src={DEFAULT_NEW_TAB_BACKGROUND_URL} />
      <GlassSurface
        variant="pageVeil"
        rounded="none"
        className="absolute inset-0 bg-gradient-to-b from-orange-50/10 via-blue-50/10 to-blue-200/20 dark:from-slate-950/40 dark:via-slate-900/30 dark:to-slate-800/40"
        aria-hidden
      />
    </div>
  );
}
