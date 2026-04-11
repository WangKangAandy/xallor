import { useState } from "react";

type RemoteBackgroundImageProps = {
  src: string;
  /** 图片无法加载时的全屏兜底（与主视觉协调的渐变，不发起网络请求） */
  fallbackClassName?: string;
};

/**
 * 全屏外链背景图：加载失败时降级为纯 CSS 渐变，避免裂图或空白。
 * 仅负责展示层；与 `storage/repository` 无耦合。
 */
export function RemoteBackgroundImage({
  src,
  fallbackClassName = "absolute inset-0 bg-gradient-to-b from-slate-900 via-sky-950 to-blue-950",
}: RemoteBackgroundImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div className={fallbackClassName} aria-hidden />;
  }

  return (
    <img
      src={src}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
      onError={() => setFailed(true)}
      decoding="async"
      fetchPriority="low"
    />
  );
}
