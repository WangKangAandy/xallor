import type { PointerEvent } from "react";

export function DesktopGridResizeChrome({
  isDragging,
  isBorderHovered,
  isResizing,
  setIsBorderHovered,
  startResize,
}: {
  isDragging: boolean;
  isBorderHovered: boolean;
  isResizing: boolean;
  setIsBorderHovered: (v: boolean) => void;
  startResize: (e: PointerEvent<Element>, dir: string) => void;
}) {
  if (isDragging) return null;

  const dot = (active: boolean) =>
    `w-1.5 h-1.5 bg-white rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.4)] transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"}`;
  const active = isBorderHovered || isResizing;

  return (
    <>
      <div
        className={`absolute inset-0 pointer-events-none z-40 transition-all duration-200 ${isBorderHovered || isResizing ? "border-[2px] border-white shadow-[0_0_8px_rgba(255,255,255,0.2)]" : "border border-transparent"}`}
        style={{ borderRadius: 36 }}
      />

      <div className="absolute inset-[-4px] z-50 pointer-events-none" style={{ borderRadius: 40 }}>
        <div
          onMouseEnter={() => setIsBorderHovered(true)}
          onMouseLeave={() => setIsBorderHovered(false)}
          onPointerDown={(e) => startResize(e, "top")}
          className="absolute top-0 left-4 right-4 h-3 cursor-ns-resize pointer-events-auto flex items-center justify-center"
        >
          <div className={dot(active)} />
        </div>
        <div
          onMouseEnter={() => setIsBorderHovered(true)}
          onMouseLeave={() => setIsBorderHovered(false)}
          onPointerDown={(e) => startResize(e, "bottom")}
          className="absolute bottom-0 left-4 right-4 h-3 cursor-ns-resize pointer-events-auto flex items-center justify-center"
        >
          <div className={dot(active)} />
        </div>
        <div
          onMouseEnter={() => setIsBorderHovered(true)}
          onMouseLeave={() => setIsBorderHovered(false)}
          onPointerDown={(e) => startResize(e, "left")}
          className="absolute top-4 bottom-4 left-0 w-3 cursor-ew-resize pointer-events-auto flex items-center justify-center"
        >
          <div className={dot(active)} />
        </div>
        <div
          onMouseEnter={() => setIsBorderHovered(true)}
          onMouseLeave={() => setIsBorderHovered(false)}
          onPointerDown={(e) => startResize(e, "right")}
          className="absolute top-4 bottom-4 right-0 w-3 cursor-ew-resize pointer-events-auto flex items-center justify-center"
        >
          <div className={dot(active)} />
        </div>

        <div
          onMouseEnter={() => setIsBorderHovered(true)}
          onMouseLeave={() => setIsBorderHovered(false)}
          onPointerDown={(e) => startResize(e, "top-left")}
          className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize pointer-events-auto"
        />
        <div
          onMouseEnter={() => setIsBorderHovered(true)}
          onMouseLeave={() => setIsBorderHovered(false)}
          onPointerDown={(e) => startResize(e, "top-right")}
          className="absolute top-0 right-0 w-4 h-4 cursor-nesw-resize pointer-events-auto"
        />
        <div
          onMouseEnter={() => setIsBorderHovered(true)}
          onMouseLeave={() => setIsBorderHovered(false)}
          onPointerDown={(e) => startResize(e, "bottom-left")}
          className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize pointer-events-auto"
        />
        <div
          onMouseEnter={() => setIsBorderHovered(true)}
          onMouseLeave={() => setIsBorderHovered(false)}
          onPointerDown={(e) => startResize(e, "bottom-right")}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize pointer-events-auto"
        />
      </div>
    </>
  );
}
