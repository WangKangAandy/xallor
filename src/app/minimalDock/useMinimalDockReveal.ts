import { useCallback, useEffect, useRef, useState } from "react";

// 鼠标离开 Dock 后延迟 1s 再收起，减少移动到右侧「+」时的误判抖动。
const CLOSE_DELAY_MS = 1000;

/**
 * Dock 自动隐藏显隐状态：进入命中区立即展开，离开后延时收起。
 */
export function useMinimalDockReveal() {
  const [revealed, setRevealed] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current != null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const reveal = useCallback(() => {
    cancelClose();
    setRevealed(true);
  }, [cancelClose]);

  const scheduleClose = useCallback((delayMs = CLOSE_DELAY_MS) => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => setRevealed(false), delayMs);
  }, [cancelClose]);

  useEffect(() => () => cancelClose(), [cancelClose]);

  return {
    revealed,
    reveal,
    scheduleClose,
  };
}
