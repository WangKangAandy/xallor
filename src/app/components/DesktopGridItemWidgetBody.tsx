import { Suspense } from "react";
import { GridDesktopCardSurface } from "./GridDesktopCardSurface";
import { GlassSurface } from "./shared/GlassSurface";
import type { AddableWidgetType } from "./widgets/addableWidgetTypes";
import { getWidgetBodyComponent } from "./widgets/widgetRegistry";

export function DesktopGridItemWidgetBody({
  widgetType,
  isArrangeMode,
  isArrangeSelected,
}: {
  widgetType: AddableWidgetType;
  isArrangeMode: boolean;
  isArrangeSelected: boolean;
}) {
  const WidgetBody = getWidgetBodyComponent(widgetType);
  return (
    <GridDesktopCardSurface
      variant="panel"
      className="pointer-events-auto h-full w-full overflow-hidden shadow-sm transition-colors group hover:bg-white/50"
      style={
        isArrangeMode && isArrangeSelected
          ? {
              boxShadow: "inset 0 0 0 2px rgba(59,130,246,0.95), inset 0 0 0 3px rgba(255,255,255,0.2)",
            }
          : undefined
      }
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
        <WidgetBody />
      </Suspense>
    </GridDesktopCardSurface>
  );
}
