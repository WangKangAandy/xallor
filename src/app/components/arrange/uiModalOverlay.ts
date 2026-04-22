/**
 * 全屏或浮层模态 UI 的统一 DOM 契约：
 * - `useArrangeGestureController` 在 `document` capture 上监听 `pointerdown`，早于子节点；须用本属性排除整棵子树。
 * - `useRestModeController` 双击小憩同理。
 *
 * 新增强模态叠层时：在**最外层可命中指针**的容器上设置 `data-ui-modal-overlay`（与是否 `role="dialog"` 无关）。
 */
export const UI_MODAL_OVERLAY_ATTR = "data-ui-modal-overlay";

export function isUnderUiModalOverlay(target: HTMLElement | null): boolean {
  return Boolean(target?.closest(`[${UI_MODAL_OVERLAY_ATTR}]`));
}
