import type { ButtonHTMLAttributes } from "react";

export type ModalScrimProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> & {
  /** 额外 class；背景与模糊来自 `theme.css` 中 `--surface-scrim-*` */
  className?: string;
};

/**
 * 全屏模态遮罩：无业务文案，样式来自 L1 `--surface-scrim-bg` / `--surface-scrim-backdrop-blur`。
 */
export function ModalScrim({ className = "", type = "button", ...props }: ModalScrimProps) {
  return (
    <button
      type={type}
      className={`absolute inset-0 transition-opacity ${className}`.trim()}
      style={{
        backgroundColor: "var(--surface-scrim-bg)",
        backdropFilter: "blur(var(--surface-scrim-backdrop-blur, 2px))",
        WebkitBackdropFilter: "blur(var(--surface-scrim-backdrop-blur, 2px))",
      }}
      {...props}
    />
  );
}
