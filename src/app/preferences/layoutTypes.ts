/**
 * 持久 UI 布局偏好（与整理会话、小憩等正交）。演进见 docs/minimal-layout-mode.md。
 */
export type LayoutMode = "default" | "minimal";

export type LayoutCapabilities = {
  showDesktop: boolean;
  allowArrange: boolean;
};
