import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { USER_LOCAL_ASSET_KEYS } from "./constants";
import {
  clearStoredKey,
  loadStoredDataUrl,
  persistDataUrl,
} from "./userLocalAssetStorage";

export type UserLocalAssetsContextValue = {
  wallpaperDataUrl: string | null;
  avatarDataUrl: string | null;
  setWallpaperDataUrl: (next: string | null) => void;
  setAvatarDataUrl: (next: string | null) => void;
};

const UserLocalAssetsContext = createContext<UserLocalAssetsContextValue | null>(null);

export function UserLocalAssetsProvider({ children }: { children: ReactNode }) {
  const [wallpaperDataUrl, setWallpaperState] = useState<string | null>(() =>
    loadStoredDataUrl(USER_LOCAL_ASSET_KEYS.wallpaper),
  );
  const [avatarDataUrl, setAvatarState] = useState<string | null>(() =>
    loadStoredDataUrl(USER_LOCAL_ASSET_KEYS.avatar),
  );

  const setWallpaperDataUrl = useCallback((next: string | null) => {
    if (next) {
      try {
        persistDataUrl(USER_LOCAL_ASSET_KEYS.wallpaper, next);
        setWallpaperState(next);
      } catch {
        /* quota / 写入失败：保留原先展示与存储 */
      }
    } else {
      clearStoredKey(USER_LOCAL_ASSET_KEYS.wallpaper);
      setWallpaperState(null);
    }
  }, []);

  const setAvatarDataUrl = useCallback((next: string | null) => {
    if (next) {
      try {
        persistDataUrl(USER_LOCAL_ASSET_KEYS.avatar, next);
        setAvatarState(next);
      } catch {
        /* quota / 写入失败：保留原先展示与存储 */
      }
    } else {
      clearStoredKey(USER_LOCAL_ASSET_KEYS.avatar);
      setAvatarState(null);
    }
  }, []);

  const value = useMemo<UserLocalAssetsContextValue>(
    () => ({
      wallpaperDataUrl,
      avatarDataUrl,
      setWallpaperDataUrl,
      setAvatarDataUrl,
    }),
    [wallpaperDataUrl, avatarDataUrl, setWallpaperDataUrl, setAvatarDataUrl],
  );

  return (
    <UserLocalAssetsContext.Provider value={value}>{children}</UserLocalAssetsContext.Provider>
  );
}

export function useUserLocalAssets(): UserLocalAssetsContextValue {
  const ctx = useContext(UserLocalAssetsContext);
  if (!ctx) {
    throw new Error("useUserLocalAssets must be used within UserLocalAssetsProvider");
  }
  return ctx;
}
