import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useMinimalDockReveal } from "./useMinimalDockReveal";

type MinimalDockHoverShellProps = {
  reduceMotion: boolean;
  children: ReactNode;
  forceRevealed?: boolean;
};

/**
 * 极简 Dock：默认收起在屏外，仅当指针进入底部热区或 Dock 区域时滑入显示。
 */
export function MinimalDockHoverShell({
  reduceMotion,
  children,
  forceRevealed = false,
}: MinimalDockHoverShellProps) {
  const { revealed, reveal, scheduleClose } = useMinimalDockReveal();
  const prevForceRevealedRef = useRef(forceRevealed);

  // 复用原有“自下而上”动效：当外部要求常显时，仅驱动 revealed 状态，不改动画实现。
  useEffect(() => {
    if (forceRevealed) {
      reveal();
    } else if (prevForceRevealedRef.current) {
      // 仅在离开“强制常显”态时触发收起，走默认 delay（1s）。
      scheduleClose();
    }
    prevForceRevealedRef.current = forceRevealed;
  }, [forceRevealed, reveal, scheduleClose]);

  return (
    <div
      className="relative flex w-full items-end justify-center"
      data-testid="minimal-dock-hover-shell"
      onMouseEnter={reveal}
      onMouseLeave={forceRevealed ? undefined : () => scheduleClose()}
    >
      <motion.div
        initial={false}
        animate={
          reduceMotion
            ? { opacity: revealed ? 1 : 0 }
            : { y: revealed ? 0 : 64, opacity: revealed ? 1 : 0 }
        }
        transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
        className="pointer-events-auto"
        style={{ pointerEvents: revealed ? "auto" : "none" }}
      >
        {children}
      </motion.div>
      {/* 底部命中条：收起时仍可悬浮唤出 */}
      <div
        className="pointer-events-auto absolute inset-x-0 -bottom-5 h-5 min-w-[200px]"
        aria-hidden
        data-testid="minimal-dock-hit-strip"
      />
    </div>
  );
}
