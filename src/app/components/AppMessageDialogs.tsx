import { GlassMessageDialog } from "./shared/GlassMessageDialog";
import type { AppMessageState } from "../useAppMessageState";

type AppMessageDialogsProps = {
  appMessage: AppMessageState;
  gotItLabel: string;
  goToPrivacySecurityLabel: string;
  closeAriaLabel: string;
  onDismissAlert: () => void;
  onConfirmGoToPrivacy: () => void;
  onDismissGoToPrivacy: () => void;
  onResolveFolderConfirm: (ok: boolean) => void;
};

export function AppMessageDialogs({
  appMessage,
  gotItLabel,
  goToPrivacySecurityLabel,
  closeAriaLabel,
  onDismissAlert,
  onConfirmGoToPrivacy,
  onDismissGoToPrivacy,
  onResolveFolderConfirm,
}: AppMessageDialogsProps) {
  return (
    <>
      {appMessage?.variant === "alert" ? (
        <GlassMessageDialog
          open
          message={appMessage.message}
          variant="alert"
          confirmLabel={gotItLabel}
          closeAriaLabel={closeAriaLabel}
          onConfirm={onDismissAlert}
        />
      ) : null}
      {appMessage?.variant === "alert-go-settings" ? (
        <GlassMessageDialog
          open
          message={appMessage.message}
          variant="alert"
          confirmLabel={goToPrivacySecurityLabel}
          showCloseButton
          closeAriaLabel={closeAriaLabel}
          onDismiss={onDismissGoToPrivacy}
          onConfirm={onConfirmGoToPrivacy}
        />
      ) : null}
      {appMessage?.variant === "confirm-folder" ? (
        <GlassMessageDialog
          open
          title="隐藏文件夹"
          message="隐藏文件夹后，原文件夹会被删除，内部图标会按单图标形式移入隐私空间，且不保留原文件夹结构。是否继续？"
          variant="confirm"
          cancelLabel="取消"
          confirmLabel="继续"
          onCancel={() => onResolveFolderConfirm(false)}
          onConfirm={() => onResolveFolderConfirm(true)}
        />
      ) : null}
    </>
  );
}
