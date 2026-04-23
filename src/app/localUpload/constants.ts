/** localStorage 中单条 Data URL 长度上限（约对应数 MB 级图片的 base64）。 */
export const MAX_STORED_DATA_URL_CHARS = 4_800_000;

/** 拒绝超过该字节数的原始文件（默认 3MB）。 */
export const DEFAULT_MAX_IMAGE_BYTES = 3 * 1024 * 1024;

export const USER_LOCAL_ASSET_KEYS = {
  wallpaper: "xallor:user-wallpaper-v1",
  avatar: "xallor:user-avatar-v1",
} as const;
