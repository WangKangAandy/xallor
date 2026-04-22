import { useCallback, useState } from "react";
import type { HiddenSpaceDialogState } from "./SettingsSpotlightPanels";

type UseHiddenSpaceDialogControllerParams = {
  onEnableHiddenSpace: (password: string) => Promise<void>;
  onDisableHiddenSpace: (password: string) => Promise<boolean>;
  onVerifyHiddenPassword: (password: string) => Promise<boolean>;
  onVerifiedOpenPanel: () => void;
  onDisableConfirmed: () => void;
};

export function useHiddenSpaceDialogController({
  onEnableHiddenSpace,
  onDisableHiddenSpace,
  onVerifyHiddenPassword,
  onVerifiedOpenPanel,
  onDisableConfirmed,
}: UseHiddenSpaceDialogControllerParams) {
  const [dialog, setDialog] = useState<HiddenSpaceDialogState>("none");
  const [passwordDraft, setPasswordDraft] = useState("");
  const [passwordConfirmDraft, setPasswordConfirmDraft] = useState("");
  const [verifyPasswordDraft, setVerifyPasswordDraft] = useState("");
  const [verifiedPassword, setVerifiedPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const resetAll = useCallback(() => {
    setDialog("none");
    setPasswordDraft("");
    setPasswordConfirmDraft("");
    setVerifyPasswordDraft("");
    setVerifiedPassword("");
    setPasswordError(null);
  }, []);

  const requestToggleHiddenSpace = useCallback(
    (hiddenSpaceEnabled: boolean) => {
      setPasswordError(null);
      setVerifyPasswordDraft("");
      setDialog(hiddenSpaceEnabled ? "verify-disable" : "enable");
    },
    [],
  );

  const requestOpenHiddenPanel = useCallback(() => {
    setPasswordError(null);
    setVerifyPasswordDraft("");
    setDialog("verify-open");
  }, []);

  const cancelEnable = useCallback(() => {
    setDialog("none");
    setPasswordDraft("");
    setPasswordConfirmDraft("");
    setPasswordError(null);
  }, []);

  const submitEnable = useCallback(async () => {
    if (passwordDraft.length < 4) {
      setPasswordError("密码长度至少 4 位");
      return;
    }
    if (passwordDraft !== passwordConfirmDraft) {
      setPasswordError("两次输入密码不一致");
      return;
    }
    await onEnableHiddenSpace(passwordDraft);
    setDialog("none");
    setPasswordDraft("");
    setPasswordConfirmDraft("");
    setPasswordError(null);
  }, [onEnableHiddenSpace, passwordConfirmDraft, passwordDraft]);

  const cancelVerify = useCallback(() => {
    setDialog("none");
    setVerifyPasswordDraft("");
    setPasswordError(null);
  }, []);

  const submitVerify = useCallback(async () => {
    const ok = await onVerifyHiddenPassword(verifyPasswordDraft);
    if (!ok) {
      setPasswordError("密码错误");
      return;
    }
    if (dialog === "verify-open") {
      onVerifiedOpenPanel();
      setDialog("panel");
    } else {
      setVerifiedPassword(verifyPasswordDraft);
      setDialog("confirm-disable");
    }
    setVerifyPasswordDraft("");
    setPasswordError(null);
  }, [dialog, onVerifiedOpenPanel, onVerifyHiddenPassword, verifyPasswordDraft]);

  const cancelConfirmDisable = useCallback(() => {
    setDialog("none");
  }, []);

  const submitConfirmDisable = useCallback(async () => {
    const ok = await onDisableHiddenSpace(verifiedPassword);
    if (!ok) return;
    onDisableConfirmed();
    setVerifiedPassword("");
    setDialog("none");
  }, [onDisableConfirmed, onDisableHiddenSpace, verifiedPassword]);

  return {
    dialog,
    setDialog,
    passwordDraft,
    setPasswordDraft,
    passwordConfirmDraft,
    setPasswordConfirmDraft,
    verifyPasswordDraft,
    setVerifyPasswordDraft,
    passwordError,
    resetAll,
    requestToggleHiddenSpace,
    requestOpenHiddenPanel,
    cancelEnable,
    submitEnable,
    cancelVerify,
    submitVerify,
    cancelConfirmDisable,
    submitConfirmDisable,
  };
}
