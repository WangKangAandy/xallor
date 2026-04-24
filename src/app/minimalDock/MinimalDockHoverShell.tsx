import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useMinimalDockReveal } from "./useMinimalDockReveal";

type MinimalDockHoverShellProps = {
  reduceMotion: boolean;
  children: ReactNode;
};

/**
 * 极简 Dock：默认收起在屏外，仅当指针进入底部热区或 Dock 区域时滑入显示。
 */
export function MinimalDockHoverShell({ reduceMotion, children }: MinimalDockHoverShellProps) {
  const { revealed, reveal, scheduleClose } = useMinimalDockReveal();

  return (
    <div
      className="flex w-full flex-col items-center justify-end pb-2 pt-1"
      data-testid="minimal-dock-hover-shell"
      onMouseEnter={reveal}
      onMouseLeave={scheduleClose}
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
        className="mt-0.5 h-5 w-full min-w-[200px] shrink-0"
        aria-hidden
        data-testid="minimal-dock-hit-strip"
      />
    </div>
  );
}
