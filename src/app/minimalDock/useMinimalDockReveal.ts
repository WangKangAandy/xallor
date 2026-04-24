import { useCallback, useEffect, useRef, useState } from "react";

const CLOSE_DELAY_MS = 380;

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

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => setRevealed(false), CLOSE_DELAY_MS);
  }, [cancelClose]);

  useEffect(() => () => cancelClose(), [cancelClose]);

  return {
    revealed,
    reveal,
    scheduleClose,
  };
}
