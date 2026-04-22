export type PrefersColorSchemeListener = (isDark: boolean) => void;

let disposeActive: (() => void) | null = null;

/**
 * 全局至多一个 `prefers-color-scheme` 的 `change` 监听；再次调用会先 dispose 旧实例。
 * 注册后立即 `listener(mq.matches)` 同步一帧。
 */
export function subscribePrefersColorSchemeChange(listener: PrefersColorSchemeListener): () => void {
  disposeActive?.();

  const mq = globalThis.matchMedia?.("(prefers-color-scheme: dark)");
  if (!mq) {
    disposeActive = null;
    return () => {};
  }

  const handler = () => listener(mq.matches);
  mq.addEventListener("change", handler);
  listener(mq.matches);

  disposeActive = () => {
    mq.removeEventListener("change", handler);
    disposeActive = null;
  };

  return () => {
    disposeActive?.();
  };
}
