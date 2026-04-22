import type { KeyboardEvent } from "react";
import type { HiddenSpaceDialogState } from "./SettingsSpotlightPanels";

type SettingsHiddenSpaceDialogProps = {
  dialog: HiddenSpaceDialogState;
  passwordDraft: string;
  setPasswordDraft: (next: string) => void;
  passwordConfirmDraft: string;
  setPasswordConfirmDraft: (next: string) => void;
  verifyPasswordDraft: string;
  setVerifyPasswordDraft: (next: string) => void;
  passwordError: string | null;
  onSubmitEnable: () => Promise<void>;
  onCancelEnable: () => void;
  onSubmitVerify: () => Promise<void>;
  onCancelVerify: () => void;
  onSubmitConfirmDisable: () => Promise<void>;
  onCancelConfirmDisable: () => void;
};

export function SettingsHiddenSpaceDialog({
  dialog,
  passwordDraft,
  setPasswordDraft,
  passwordConfirmDraft,
  setPasswordConfirmDraft,
  verifyPasswordDraft,
  setVerifyPasswordDraft,
  passwordError,
  onSubmitEnable,
  onCancelEnable,
  onSubmitVerify,
  onCancelVerify,
  onSubmitConfirmDisable,
  onCancelConfirmDisable,
}: SettingsHiddenSpaceDialogProps) {
  if (dialog === "none" || dialog === "panel") return null;

  const handleSubmitOnEnter = async (
    e: KeyboardEvent<HTMLInputElement>,
    submit: () => Promise<void>,
  ) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    await submit();
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/35 p-6" data-ui-modal-overlay>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xl dark:border-slate-600 dark:bg-slate-800">
        {dialog === "enable" ? (
          <div className="space-y-3">
            <div className="text-sm font-medium">开启隐私空间</div>
            <input
              type="password"
              value={passwordDraft}
              onChange={(e) => setPasswordDraft(e.target.value)}
              onKeyDown={(e) => {
                void handleSubmitOnEnter(e, onSubmitEnable);
              }}
              placeholder="请输入密码（至少 4 位）"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
            />
            <input
              type="password"
              value={passwordConfirmDraft}
              onChange={(e) => setPasswordConfirmDraft(e.target.value)}
              onKeyDown={(e) => {
                void handleSubmitOnEnter(e, onSubmitEnable);
              }}
              placeholder="请再次输入密码"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
            />
            {passwordError ? <div className="text-xs text-red-500">{passwordError}</div> : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-600"
                onClick={onCancelEnable}
              >
                取消
              </button>
              <button
                type="button"
                className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs text-white"
                onClick={() => {
                  void onSubmitEnable();
                }}
              >
                开启
              </button>
            </div>
          </div>
        ) : null}

        {dialog === "verify-open" || dialog === "verify-disable" ? (
          <div className="space-y-3">
            <div className="text-sm font-medium">请输入隐私空间密码</div>
            <input
              type="password"
              value={verifyPasswordDraft}
              onChange={(e) => setVerifyPasswordDraft(e.target.value)}
              onKeyDown={(e) => {
                void handleSubmitOnEnter(e, onSubmitVerify);
              }}
              placeholder="请输入密码"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
            />
            {passwordError ? <div className="text-xs text-red-500">{passwordError}</div> : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-600"
                onClick={onCancelVerify}
              >
                取消
              </button>
              <button
                type="button"
                className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs text-white"
                onClick={() => {
                  void onSubmitVerify();
                }}
              >
                确认
              </button>
            </div>
          </div>
        ) : null}

        {dialog === "confirm-disable" ? (
          <div className="space-y-3">
            <div className="text-sm font-medium">关闭后将清空所有隐藏图标及密码，且不可恢复</div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-600"
                onClick={onCancelConfirmDisable}
              >
                取消
              </button>
              <button
                type="button"
                className="rounded-lg bg-red-500 px-3 py-1.5 text-xs text-white"
                onClick={() => {
                  void onSubmitConfirmDisable();
                }}
              >
                确认关闭
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
