import { useCallback, useId, useRef, type ChangeEvent, type ReactNode } from "react";
import { DEFAULT_MAX_IMAGE_BYTES } from "../../localUpload/constants";
import {
  pickLocalImageAsDataUrlFromInputEvent,
  type PickLocalImageAsDataUrlOptions,
  type PickLocalImageFailureReason,
} from "../../localUpload/pickLocalImageAsDataUrl";

export type LocalFileUploadButtonProps = {
  /** 传给 `<input type="file" />` 的 accept，默认常见图片类型 */
  accept?: string;
  maxBytes?: number;
  disabled?: boolean;
  className?: string;
  /** 可选：触发按钮的 a11y 标签（例如图标槽无可见文案时） */
  "aria-label"?: string;
  /** 可选：覆盖 hidden input 的 id，便于 aria-labelledby */
  inputId?: string;
  children: ReactNode;
  onPick: (payload: { dataUrl: string; file: File }) => void | Promise<void>;
  onPickError?: (reason: PickLocalImageFailureReason) => void;
};

/**
 * 通用「点击选择本地图片」：隐藏 file input + 按钮触发，校验体积与 MIME 后产出 Data URL。
 */
export function LocalFileUploadButton({
  accept = "image/jpeg,image/png,image/gif,image/webp,image/svg+xml",
  maxBytes = DEFAULT_MAX_IMAGE_BYTES,
  disabled,
  className,
  "aria-label": ariaLabel,
  inputId: inputIdProp,
  children,
  onPick,
  onPickError,
}: LocalFileUploadButtonProps) {
  const reactId = useId();
  const inputId = inputIdProp ?? `local-file-upload-${reactId}`;
  const inputRef = useRef<HTMLInputElement>(null);

  const options: PickLocalImageAsDataUrlOptions = { maxBytes };

  const handleChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const result = await pickLocalImageAsDataUrlFromInputEvent(event, options);
      event.target.value = "";
      if (result.ok) {
        await onPick({ dataUrl: result.dataUrl, file: result.file });
      } else {
        onPickError?.(result.reason);
      }
    },
    [maxBytes, onPick, onPickError],
  );

  return (
    <>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        onChange={handleChange}
      />
      <button
        type="button"
        disabled={disabled}
        className={className}
        aria-label={ariaLabel}
        onClick={() => inputRef.current?.click()}
      >
        {children}
      </button>
    </>
  );
}
