import type { LayoutCapabilities, LayoutMode } from "./layoutTypes";

const TABLE: Record<LayoutMode, LayoutCapabilities> = {
  default: { showDesktop: true, allowArrange: true },
  minimal: { showDesktop: false, allowArrange: false },
};

/**
 * 首版为查表；未来可替换为 resolveLayoutCapabilities(context) 而不改调用方。
 */
export function getLayoutCapabilities(layoutMode: LayoutMode): LayoutCapabilities {
  return TABLE[layoutMode];
}
