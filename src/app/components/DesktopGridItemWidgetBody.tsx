import { lazy, Suspense } from "react";
import { GridDesktopCardSurface } from "./GridDesktopCardSurface";
import { GlassSurface } from "./shared/GlassSurface";

const WeatherCard = lazy(async () => {
  const m = await import("./WeatherCard");
  return { default: m.WeatherCard };
});

export function DesktopGridItemWidgetBody({ widgetType }: { widgetType: "weather" | "calendar" }) {
  if (widgetType === "weather") {
    return (
      <GridDesktopCardSurface
        variant="panel"
        className="pointer-events-auto h-full w-full overflow-hidden shadow-sm transition-colors group hover:bg-white/50"
      >
        <Suspense
          fallback={
            <GlassSurface
              variant="widgetSkeleton"
              rounded="none"
              className="h-full min-h-[120px] w-full animate-pulse rounded-none"
              style={{ borderRadius: "var(--grid-panel-radius)" }}
              aria-hidden
            />
          }
        >
          <WeatherCard />
        </Suspense>
      </GridDesktopCardSurface>
    );
  }
  return null;
}
