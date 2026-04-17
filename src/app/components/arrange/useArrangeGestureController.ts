import { useEffect, useRef, type RefObject } from "react";
import { buildSelectionRect } from "./selectionMath";
import { getArrangeGestureExclusionReason } from "./arrangeGestureExclusions";
import { collectHitSelectionIds, type ResolveSelectableIdsByGridItemId } from "./selectionEngine";

const SELECTION_DRAG_THRESHOLD_PX = 6;

type ArrangeGestureSession = {
  state: { isArrangeMode: boolean };
  enterArrangeMode: (activePageId: string) => void;
  setSelectedExact: (ids: string[]) => void;
  setSelecting: (value: boolean) => void;
  setSelectionRect: (rect: { x: number; y: number; w: number; h: number } | null) => void;
};

type UseArrangeGestureControllerParams = {
  enabled?: boolean;
  pageId?: string;
  gridRef: RefObject<HTMLDivElement | null>;
  arrangeSession: ArrangeGestureSession;
  resolveSelectableIdsByGridItemId: ResolveSelectableIdsByGridItemId;
};

type ArrangeGestureDebugEvent = {
  phase: string;
  ts?: number;
  x?: number;
  y?: number;
  distance?: number;
  hitCount?: number;
  exclusionReason?: string | null;
  isArrangeMode?: boolean;
};

type ArrangeGestureDebugApi = {
  enable: (verbose?: boolean) => void;
  disable: () => void;
  clear: () => void;
  dump: () => ArrangeGestureDebugEvent[];
  summary: () => Record<string, number>;
};

declare global {
  interface Window {
    __arrangeGestureDebugEnabled?: boolean;
    __arrangeGestureDebugVerbose?: boolean;
    __arrangeGestureDebugEvents?: ArrangeGestureDebugEvent[];
    __arrangeGestureDebugApi?: ArrangeGestureDebugApi;
  }
}

/**
 * 统一“拖动进入整理模式”的手势控制器：
 * - 从实体外区域起手
 * - move 期间实时重算命中集（动态增减）
 * - 首次命中即进入整理模式（无需等待 pointerup）
 */
export function useArrangeGestureController({
  enabled = true,
  pageId,
  gridRef,
  arrangeSession,
  resolveSelectableIdsByGridItemId,
}: UseArrangeGestureControllerParams): void {
  const gestureRef = useRef<{
    startX: number;
    startY: number;
    activated: boolean;
    enteredArrangeMode: boolean;
  } | null>(null);
  const latestPointerRef = useRef<{ x: number; y: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const arrangeSessionRef = useRef(arrangeSession);
  const pageIdRef = useRef(pageId);
  const resolveSelectableIdsByGridItemIdRef = useRef(resolveSelectableIdsByGridItemId);

  useEffect(() => {
    arrangeSessionRef.current = arrangeSession;
    pageIdRef.current = pageId;
    resolveSelectableIdsByGridItemIdRef.current = resolveSelectableIdsByGridItemId;
  }, [arrangeSession, pageId, resolveSelectableIdsByGridItemId]);

  useEffect(() => {
    const ensureDebugApi = () => {
      if (window.__arrangeGestureDebugApi) return;
      window.__arrangeGestureDebugApi = {
        enable: (verbose = false) => {
          window.__arrangeGestureDebugEnabled = true;
          window.__arrangeGestureDebugVerbose = verbose;
        },
        disable: () => {
          window.__arrangeGestureDebugEnabled = false;
          window.__arrangeGestureDebugVerbose = false;
        },
        clear: () => {
          window.__arrangeGestureDebugEvents = [];
        },
        dump: () => [...(window.__arrangeGestureDebugEvents ?? [])],
        summary: () =>
          (window.__arrangeGestureDebugEvents ?? []).reduce<Record<string, number>>((acc, event) => {
            const key = event.phase ?? "unknown";
            acc[key] = (acc[key] ?? 0) + 1;
            return acc;
          }, {}),
      };
    };

    ensureDebugApi();
    if (!enabled) return;

    const debugLog = (event: ArrangeGestureDebugEvent) => {
      if (!window.__arrangeGestureDebugEnabled) return;
      if (!window.__arrangeGestureDebugEvents) {
        window.__arrangeGestureDebugEvents = [];
      }
      const enrichedEvent = { ...event, ts: Date.now() };
      window.__arrangeGestureDebugEvents.push(enrichedEvent);
      if (window.__arrangeGestureDebugEvents.length > 400) {
        window.__arrangeGestureDebugEvents.shift();
      }
      if (window.__arrangeGestureDebugVerbose) {
        // eslint-disable-next-line no-console
        console.debug("[arrange-gesture]", enrichedEvent);
      }
    };

    const flushPointerMove = () => {
      rafIdRef.current = null;
      const gesture = gestureRef.current;
      const pointer = latestPointerRef.current;
      if (!gesture || !pointer) return;

      const selection = buildSelectionRect(
        { x: gesture.startX, y: gesture.startY },
        { x: pointer.x, y: pointer.y },
      );
      const session = arrangeSessionRef.current;
      const distance = Math.hypot(pointer.x - gesture.startX, pointer.y - gesture.startY);
      debugLog({ phase: "move-flush", x: pointer.x, y: pointer.y, distance, isArrangeMode: session.state.isArrangeMode });
      if (!gesture.activated && distance < SELECTION_DRAG_THRESHOLD_PX) return;
      if (!gesture.activated) {
        gesture.activated = true;
        session.setSelecting(true);
      }

      session.setSelectionRect({
        x: selection.left,
        y: selection.top,
        w: selection.right - selection.left,
        h: selection.bottom - selection.top,
      });

      const hitIds = collectHitSelectionIds(
        gridRef.current,
        selection,
        resolveSelectableIdsByGridItemIdRef.current,
      );
      debugLog({ phase: "move-hit", hitCount: hitIds.length, isArrangeMode: session.state.isArrangeMode });
      if (hitIds.length > 0 && !gesture.enteredArrangeMode && !session.state.isArrangeMode) {
        gesture.enteredArrangeMode = true;
        session.enterArrangeMode(pageIdRef.current ?? "__single_page__");
        debugLog({ phase: "enter-arrange", hitCount: hitIds.length });
      }
      if (gesture.enteredArrangeMode || session.state.isArrangeMode) {
        session.setSelectedExact(hitIds);
        debugLog({ phase: "set-selected-exact", hitCount: hitIds.length });
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!gestureRef.current) return;
      // Edge 下若不阻止默认行为，穿过 draggable 卡片时可能提前进入原生拖拽，导致后续 pointermove 丢失。
      if (event.cancelable) {
        event.preventDefault();
      }
      latestPointerRef.current = { x: event.clientX, y: event.clientY };
      debugLog({ phase: "move-raw", x: event.clientX, y: event.clientY });
      if (rafIdRef.current != null) return;
      rafIdRef.current = globalThis.requestAnimationFrame(flushPointerMove);
    };

    const onPointerUp = () => {
      if (!gestureRef.current) return;
      const session = arrangeSessionRef.current;
      debugLog({ phase: "pointer-up" });
      if (rafIdRef.current != null) {
        globalThis.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
        flushPointerMove();
      }
      gestureRef.current = null;
      latestPointerRef.current = null;
      session.setSelectionRect(null);
      session.setSelecting(false);
      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerup", onPointerUp, true);
    };

    const onPointerDown = (event: PointerEvent) => {
      const session = arrangeSessionRef.current;
      if (session.state.isArrangeMode) return;
      if (event.button !== 0) return;
      const exclusionReason = getArrangeGestureExclusionReason(event.target as HTMLElement | null);
      if (exclusionReason) {
        debugLog({
          phase: "pointer-down-rejected",
          x: event.clientX,
          y: event.clientY,
          exclusionReason,
        });
        return;
      }
      debugLog({ phase: "pointer-down-accepted", x: event.clientX, y: event.clientY });
      // 抑制浏览器默认文本选择/原生拖拽，保证框选手势在不同 Chromium 壳（Chrome/Edge）行为一致。
      if (event.cancelable) {
        event.preventDefault();
      }

      gestureRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        activated: false,
        enteredArrangeMode: false,
      };
      window.addEventListener("pointermove", onPointerMove, true);
      window.addEventListener("pointerup", onPointerUp, true);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      if (rafIdRef.current != null) {
        globalThis.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [enabled, gridRef]);
}
