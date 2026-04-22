import { useCallback, useState } from "react";

export type AppMessageState =
  | null
  | { variant: "alert"; message: string }
  | { variant: "alert-go-settings"; message: string }
  | { variant: "confirm-folder"; resolve: (ok: boolean) => void };

export function useAppMessageState() {
  const [appMessage, setAppMessage] = useState<AppMessageState>(null);

  const clearMessage = useCallback(() => {
    setAppMessage(null);
  }, []);

  const showAlert = useCallback((message: string) => {
    setAppMessage({ variant: "alert", message });
  }, []);

  const showGoToSettingsAlert = useCallback((message: string) => {
    setAppMessage({ variant: "alert-go-settings", message });
  }, []);

  const requestFolderHideConfirm = useCallback(async () => {
    return await new Promise<boolean>((resolve) => {
      queueMicrotask(() => {
        setAppMessage({ variant: "confirm-folder", resolve });
      });
    });
  }, []);

  const resolveFolderHideConfirm = useCallback((ok: boolean) => {
    setAppMessage((prev) => {
      if (!prev || prev.variant !== "confirm-folder") return prev;
      prev.resolve(ok);
      return null;
    });
  }, []);

  return {
    appMessage,
    clearMessage,
    showAlert,
    showGoToSettingsAlert,
    requestFolderHideConfirm,
    resolveFolderHideConfirm,
  };
}
