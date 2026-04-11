import { motion } from "motion/react";
import type { GridPayload } from "../storage/types";

type Props = {
  pages: GridPayload[];
  activePageIndex: number;
  pulseEpoch: number;
  reduceMotion: boolean | null;
  pulseTransition: object;
};

/** 当前白点脉冲：切页与「拒绝新建」共用同一套 scale / transition（pulseEpoch 递增即重播）。 */
export function DesktopPageDotsRow({ pages, activePageIndex, pulseEpoch, reduceMotion, pulseTransition }: Props) {
  return pages.map((_, i) =>
    i === activePageIndex ? (
      <motion.span
        key={`dot-active-${i}-${pulseEpoch}`}
        className="block h-1.5 w-1.5 rounded-full bg-white shadow-sm"
        initial={{ scale: 1 }}
        animate={reduceMotion ? { scale: 1 } : { scale: [1, 1.28, 1] }}
        transition={reduceMotion ? { duration: 0 } : pulseTransition}
      />
    ) : (
      <span key={`dot-${i}`} className="h-1.5 w-1.5 rounded-full bg-white/45" />
    ),
  );
}
