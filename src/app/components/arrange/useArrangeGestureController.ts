import { useEffect, useRef } from "react";
import { buildSelectionRect } from "./selectionMath";
import { getArrangeGestureExclusionReason } from "./arrangeGestureExclusions";
import { collectHitSelectionIds } from "./selectionEngine";

const SELECTION_DRAG_THRESHOLD_PX = 6;

type ArrangeGestureSession = {
  state: { isArrangeMode: boolean };
  enterArrangeMode: (activePageId: string) => void;
  setSelectedExact: (ids: string[]) => void;
  setSelecting: (value: boolean) => void;
  setSelectionRect: (rect: { x: number; y: number; w: number; h: number } | null) => void;
};

export type ArrangeGestureGridRuntime = {
  gridId: string;
  pageId: string;
  getRootEl: () => HTMLElement | null;
  isMounted: () => boolean;
  resolveSelectableIdsByGridItemId: (gridItemId: string) => string[];
};

type UseArrangeGestureControllerParams = {
  arrangeSession: ArrangeGestureSession;
  getGridRuntimes: () => ArrangeGestureGridRuntime[];
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
  lockedGridId?: string | null;
  hoverGridId?: string | null;
  abortReason?: "stale-runtime" | "missing-runtime";
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
  arrangeSession,
  getGridRuntimes,
}: UseArrangeGestureControllerParams): void {
  const gestureRef = useRef<{
    startX: number;
    startY: number;
    activated: boolean;
    enteredArrangeMode: boolean;
    lockedGridId: string | null;
    lockedPageId: string | null;
  } | null>(null);
  const latestPointerRef = useRef<{ x: number; y: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const arrangeSessionRef = useRef(arrangeSession);
  const getGridRuntimesRef = useRef(getGridRuntimes);

  useEffect(() => {
    arrangeSessionRef.current = arrangeSession;
    getGridRuntimesRef.current = getGridRuntimes;
  }, [arrangeSession, getGridRuntimes]);

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

    const resolveRuntimeById = (gridId: string): ArrangeGestureGridRuntime | null => {
      return getGridRuntimesRef.current().find((runtime) => runtime.gridId === gridId) ?? null;
    };

    const pickHoverRuntimeByPoint = (x: number, y: number): ArrangeGestureGridRuntime | null => {
      const runtimes = getGridRuntimesRef.current();
      for (const runtime of runtimes) {
        const root = runtime.getRootEl();
        if (!root || !root.isConnected) continue;
        const rect = root.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          return runtime;
        }
      }
      return null;
    };

    const collectHitsAcrossRuntimes = (
      selection: ReturnType<typeof buildSelectionRect>,
      preferredRuntime?: ArrangeGestureGridRuntime | null,
    ): { runtime: ArrangeGestureGridRuntime; hitIds: string[] } | null => {
      const runtimes = getGridRuntimesRef.current();
      const candidates = preferredRuntime
        ? [preferredRuntime, ...runtimes.filter((r) => r.gridId !== preferredRuntime.gridId)]
        : runtimes;
      for (const runtime of candidates) {
        const root = runtime.getRootEl();
        if (!runtime.isMounted() || !root || !root.isConnected) continue;
        const hitIds = collectHitSelectionIds(root, selection, runtime.resolveSelectableIdsByGridItemId);
        if (hitIds.length > 0) {
          return { runtime, hitIds };
        }
      }
      return null;
    };

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

    const abortGesture = (reason: "stale-runtime" | "missing-runtime") => {
      const session = arrangeSessionRef.current;
      debugLog({
        phase: "gesture-abort",
        abortReason: reason,
        lockedGridId: gestureRef.current?.lockedGridId ?? null,
      });
      gestureRef.current = null;
      latestPointerRef.current = null;
      session.setSelectionRect(null);
      session.setSelecting(false);
      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerup", onPointerUp, true);
    };

    const flushPointerMove = () => {
      rafIdRef.current = null;
      const gesture = gestureRef.current;
      const pointer = latestPointerRef.current;
      if (!gesture || !pointer) return;
      const hoverRuntime = pickHoverRuntimeByPoint(pointer.x, pointer.y);

      const selection = buildSelectionRect(
        { x: gesture.startX, y: gesture.startY },
        { x: pointer.x, y: pointer.y },
      );
      const session = arrangeSessionRef.current;
      const distance = Math.hypot(pointer.x - gesture.startX, pointer.y - gesture.startY);
      debugLog({
        phase: "move-flush",
        x: pointer.x,
        y: pointer.y,
        distance,
        isArrangeMode: session.state.isArrangeMode,
        lockedGridId: gesture.lockedGridId,
        hoverGridId: hoverRuntime?.gridId ?? null,
      });
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

      let hitIds: string[] = [];
      if (gesture.lockedGridId) {
        const existingRuntime = resolveRuntimeById(gesture.lockedGridId);
        if (!existingRuntime) {
          abortGesture("missing-runtime");
          return;
        }
        const root = existingRuntime.getRootEl();
        if (!existingRuntime.isMounted() || !root || !root.isConnected) {
          abortGesture("stale-runtime");
          return;
        }
        hitIds = collectHitSelectionIds(root, selection, existingRuntime.resolveSelectableIdsByGridItemId);
      } else {
        const firstHit = collectHitsAcrossRuntimes(selection, hoverRuntime);
        if (firstHit) {
          hitIds = firstHit.hitIds;
          gesture.lockedGridId = firstHit.runtime.gridId;
          gesture.lockedPageId = firstHit.runtime.pageId;
          debugLog({
            phase: "lock-from-hit",
            lockedGridId: firstHit.runtime.gridId,
            hoverGridId: hoverRuntime?.gridId ?? null,
            hitCount: firstHit.hitIds.length,
          });
        } else {
          debugLog({
            phase: "move-no-lock-yet",
            x: pointer.x,
            y: pointer.y,
            hoverGridId: hoverRuntime?.gridId ?? null,
          });
          return;
        }
      }
      debugLog({
        phase: "move-hit",
        hitCount: hitIds.length,
        isArrangeMode: session.state.isArrangeMode,
        lockedGridId: gesture.lockedGridId,
        hoverGridId: hoverRuntime?.gridId ?? null,
      });
      if (hitIds.length > 0 && !gesture.enteredArrangeMode && !session.state.isArrangeMode) {
        gesture.enteredArrangeMode = true;
        session.enterArrangeMode(gesture.lockedPageId ?? "__single_page__");
        debugLog({ phase: "enter-arrange", hitCount: hitIds.length, lockedGridId: gesture.lockedGridId });
      }
      if (gesture.enteredArrangeMode || session.state.isArrangeMode) {
        session.setSelectedExact(hitIds);
        debugLog({ phase: "set-selected-exact", hitCount: hitIds.length, lockedGridId: gesture.lockedGridId });
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!gestureRef.current) return;
      // Edge 下若不阻止默认行为，穿过 draggable 卡片时可能提前进入原生拖拽，导致后续 pointermove 丢失。
      if (event.cancelable) {
        event.preventDefault();
      }
      latestPointerRef.current = { x: event.clientX, y: event.clientY };
      debugLog({
        phase: "move-raw",
        x: event.clientX,
        y: event.clientY,
        lockedGridId: gestureRef.current.lockedGridId,
      });
      if (rafIdRef.current != null) return;
      rafIdRef.current = globalThis.requestAnimationFrame(flushPointerMove);
    };

    const onPointerUp = () => {
      if (!gestureRef.current) return;
      const session = arrangeSessionRef.current;
      debugLog({ phase: "pointer-up", lockedGridId: gestureRef.current.lockedGridId });
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
      debugLog({
        phase: "pointer-down-accepted",
        x: event.clientX,
        y: event.clientY,
        lockedGridId: null,
        exclusionReason: "pending-lock-until-first-hit",
      });
      // 抑制浏览器默认文本选择/原生拖拽，保证框选手势在不同 Chromium 壳（Chrome/Edge）行为一致。
      if (event.cancelable) {
        event.preventDefault();
      }

      gestureRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        activated: false,
        enteredArrangeMode: false,
        lockedGridId: null,
        lockedPageId: null,
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
  }, []);
}
