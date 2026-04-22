import { GlassSurface } from "./GlassSurface";
import { X } from "lucide-react";

export type GlassMessageDialogProps = {
  open: boolean;
  /** 外层 z-index，需高于同时存在的其它模态时可传入，如设置内 `z-[130]` */
  overlayClassName?: string;
  title?: string;
  message: string;
  variant: "alert" | "confirm";
  confirmLabel?: string;
  cancelLabel?: string;
  /** 是否显示右上角关闭按钮（仅关闭，不执行确认动作）。 */
  showCloseButton?: boolean;
  /** 关闭行为（遮罩点击 + 右上角 X）；未传时沿用历史行为。 */
  onDismiss?: () => void;
  closeAriaLabel?: string;
  /** 危险操作用红色主按钮 */
  confirmDestructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
};

/**
 * 应用内提示/确认框，替代 `alert` / `confirm`，视觉与 GlassSurface 体系一致。
 * 根节点须带 `data-ui-modal-overlay`，避免穿透到背后手势层。
 */
export function GlassMessageDialog({
  open,
  overlayClassName = "z-[115]",
  title,
  message,
  variant,
  confirmLabel = "确定",
  cancelLabel = "取消",
  showCloseButton = false,
  onDismiss,
  closeAriaLabel = "Close",
  confirmDestructive = false,
  onConfirm,
  onCancel,
}: GlassMessageDialogProps) {
  if (!open) return null;

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
      return;
    }
    if (variant === "confirm") onCancel?.();
    else onConfirm();
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-6 ${overlayClassName}`}
      data-ui-modal-overlay
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={title ? "glass-message-dialog-title" : undefined}
    >
      <button
        type="button"
        aria-label={closeAriaLabel}
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]"
        onClick={handleDismiss}
      />
      <GlassSurface
        variant="panel"
        rounded="2xl"
        className="relative z-10 w-full max-w-[min(420px,calc(100vw-2rem))] border border-slate-200/80 p-5 shadow-2xl dark:border-slate-600/80"
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton ? (
          <button
            type="button"
            aria-label={closeAriaLabel}
            className="absolute right-3 top-3 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-900/5 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-300"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        {title ? (
          <div id="glass-message-dialog-title" className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </div>
        ) : null}
        <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{message}</div>
        <div className="mt-5 flex justify-end gap-2">
          {variant === "confirm" ? (
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white/90 px-4 py-2 text-sm text-slate-700 transition hover:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={() => onCancel?.()}
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            type="button"
            className={`rounded-lg px-4 py-2 text-sm text-white transition ${
              confirmDestructive
                ? "bg-red-500 hover:bg-red-600"
                : "bg-sky-500/90 hover:bg-sky-600"
            }`}
            onClick={() => onConfirm()}
          >
            {confirmLabel}
          </button>
        </div>
      </GlassSurface>
    </div>
  );
}
