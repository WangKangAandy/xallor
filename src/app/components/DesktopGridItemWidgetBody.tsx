import { lazy, Suspense } from "react";
import { GlassSurface } from "./shared/GlassSurface";

const WeatherCard = lazy(async () => {
  const m = await import("./WeatherCard");
  return { default: m.WeatherCard };
});

export function DesktopGridItemWidgetBody({ widgetType }: { widgetType: "weather" | "calendar" }) {
  if (widgetType === "weather") {
    return (
      <div className="w-full h-full overflow-hidden pointer-events-auto shadow-sm" style={{ borderRadius: 36 }}>
        <Suspense
          fallback={
            <GlassSurface
              variant="widgetSkeleton"
              rounded="none"
              className="w-full h-full min-h-[120px] animate-pulse rounded-[36px]"
              aria-hidden
            />
          }
        >
          <WeatherCard />
        </Suspense>
      </div>
    );
  }
  return null;
}
