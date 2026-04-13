import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

export type RestModeTriggerSource = "double-click" | "keyboard-shortcut" | "pet-button" | "manual-button";
export type RestModeWakeSource = "mouse" | "keyboard" | "touch" | "manual-button" | "pet-interaction";

/** 鼠标累计移动达到该距离（px）才视为有意唤醒，过滤桌面轻微抖动。 */
const MOUSE_WAKE_ACCUM_DISTANCE_PX = 160;

function isInteractiveElement(target: HTMLElement): boolean {
  if (target.closest("[data-rest-ignore='true']")) return true;
  if (target.closest("button,input,textarea,select,a,[role='button'],[role='option'],[role='dialog']")) return true;
  return false;
}

export function useRestModeController() {
  const [isResting, setIsResting] = useState(false);
  const [lastTriggerSource, setLastTriggerSource] = useState<RestModeTriggerSource | null>(null);
  const [restEnteredAt, setRestEnteredAt] = useState(0);
  const lastMousePointRef = useRef<{ x: number; y: number } | null>(null);
  const accumulatedMoveRef = useRef(0);

  const enterRestMode = useCallback((source: RestModeTriggerSource) => {
    setLastTriggerSource(source);
    setRestEnteredAt(Date.now());
    accumulatedMoveRef.current = 0;
    lastMousePointRef.current = null;
    setIsResting(true);
  }, []);

  const wakeFromRestMode = useCallback((_source: RestModeWakeSource) => {
    setIsResting(false);
  }, []);

  const handleDoubleClickCapture = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      // 拦截浏览器在双击后的默认文本选中/悬浮工具条。
      event.preventDefault();
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (isInteractiveElement(target)) return;
      if (typeof window !== "undefined") {
        window.getSelection?.()?.removeAllRanges();
      }
      enterRestMode("double-click");
    },
    [enterRestMode],
  );

  useEffect(() => {
    if (!isResting || typeof document === "undefined") return;
    // 用户双击属于手势上下文，尽量在进入小憩时请求全屏以覆盖浏览器顶部 UI。
    void document.documentElement.requestFullscreen?.().catch(() => {
      // 静默降级：部分浏览器策略可能拒绝全屏，不影响小憩主流程。
    });
  }, [isResting]);

  useEffect(() => {
    if (isResting || typeof document === "undefined") return;
    if (!document.fullscreenElement) return;
    void document.exitFullscreen?.().catch(() => {
      // 忽略退出失败，避免影响 UI 恢复。
    });
  }, [isResting]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // 统一快捷键入口：Ctrl/Cmd + Shift + L 进入小憩。
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "l") {
        event.preventDefault();
        enterRestMode("keyboard-shortcut");
        return;
      }
      if (!isResting) return;
      wakeFromRestMode("keyboard");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enterRestMode, isResting, wakeFromRestMode]);

  useEffect(() => {
    if (!isResting) return;
    const shouldIgnoreWake = () => Date.now() - restEnteredAt < 900;
    const onMouseMoveWake = (event: globalThis.MouseEvent) => {
      if (shouldIgnoreWake()) return;
      const prev = lastMousePointRef.current;
      const next = { x: event.clientX, y: event.clientY };
      lastMousePointRef.current = next;
      if (!prev) return;
      const delta = Math.hypot(next.x - prev.x, next.y - prev.y);
      // 过滤“桌面轻微震动/传感器抖动”导致的微小移动。
      if (delta < 1) return;
      accumulatedMoveRef.current += delta;
      if (accumulatedMoveRef.current < MOUSE_WAKE_ACCUM_DISTANCE_PX) return;
      wakeFromRestMode("mouse");
    };
    const onTouchWake = () => {
      if (shouldIgnoreWake()) return;
      wakeFromRestMode("touch");
    };
    const onMouseDownWake = () => {
      if (shouldIgnoreWake()) return;
      wakeFromRestMode("mouse");
    };
    const onWheelWake = () => {
      if (shouldIgnoreWake()) return;
      wakeFromRestMode("mouse");
    };
    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener("mousemove", onMouseMoveWake, opts);
    window.addEventListener("mousedown", onMouseDownWake, opts);
    window.addEventListener("wheel", onWheelWake, opts);
    window.addEventListener("touchstart", onTouchWake, opts);
    return () => {
      window.removeEventListener("mousemove", onMouseMoveWake);
      window.removeEventListener("mousedown", onMouseDownWake);
      window.removeEventListener("wheel", onWheelWake);
      window.removeEventListener("touchstart", onTouchWake);
    };
  }, [isResting, wakeFromRestMode, restEnteredAt]);

  return useMemo(
    () => ({
      isResting,
      lastTriggerSource,
      enterRestMode,
      wakeFromRestMode,
      handleDoubleClickCapture,
    }),
    [isResting, lastTriggerSource, enterRestMode, wakeFromRestMode, handleDoubleClickCapture],
  );
}

