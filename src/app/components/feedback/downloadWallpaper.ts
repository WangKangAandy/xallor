export type BackgroundSource =
  | { kind: "image"; url: string }
  | { kind: "video"; url: string }
  | { kind: "unknown"; url: string };

export type DownloadWallpaperResult =
  | { ok: true; mode: "download" }
  | { ok: true; mode: "fallback-opened" }
  | { ok: false; reason: "popup-blocked" | "invalid-url" | "fetch-failed" | "unknown" };

function resolveKindFromMime(mime: string): BackgroundSource["kind"] {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "unknown";
}

function extFromMime(mime: string): string | null {
  const normalized = mime.toLowerCase();
  if (normalized.includes("jpeg")) return "jpg";
  if (normalized.includes("png")) return "png";
  if (normalized.includes("webp")) return "webp";
  if (normalized.includes("gif")) return "gif";
  if (normalized.includes("mp4")) return "mp4";
  if (normalized.includes("webm")) return "webm";
  return null;
}

function extFromUrlPath(url: URL): string | null {
  const match = url.pathname.match(/\.([a-zA-Z0-9]+)$/);
  if (!match?.[1]) return null;
  return match[1].toLowerCase();
}

function defaultExtByKind(kind: BackgroundSource["kind"]): string {
  if (kind === "video") return "mp4";
  if (kind === "image") return "jpg";
  return "bin";
}

function formatTimeStamp(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}

function fallbackOpenInNewTab(url: string): DownloadWallpaperResult {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) return { ok: false, reason: "popup-blocked" };
  return { ok: true, mode: "fallback-opened" };
}

export function getCurrentWallpaperSource(): BackgroundSource | null {
  const media = document.querySelector<HTMLElement>("[data-background-media='true']");
  if (!media) return null;
  const rawUrl = media.getAttribute("data-background-src") ?? media.getAttribute("src");
  if (!rawUrl) return null;
  const kindAttr = media.getAttribute("data-background-kind");
  const kind = kindAttr === "image" || kindAttr === "video" ? kindAttr : "unknown";
  return { kind, url: rawUrl };
}

export async function downloadWallpaper(source: BackgroundSource): Promise<DownloadWallpaperResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(source.url, window.location.href);
  } catch {
    return { ok: false, reason: "invalid-url" };
  }

  try {
    const response = await fetch(parsedUrl.toString(), { mode: "cors" });
    if (!response.ok) {
      return fallbackOpenInNewTab(parsedUrl.toString());
    }
    const blob = await response.blob();
    const contentType = response.headers.get("content-type") ?? blob.type ?? "";
    const inferredKind = resolveKindFromMime(contentType);
    const resolvedKind = source.kind === "unknown" ? inferredKind : source.kind;
    const ext =
      extFromMime(contentType) ??
      extFromUrlPath(parsedUrl) ??
      defaultExtByKind(resolvedKind === "unknown" ? source.kind : resolvedKind);
    const filename = `xallor-background-${formatTimeStamp()}.${ext}`;
    triggerBlobDownload(blob, filename);
    return { ok: true, mode: "download" };
  } catch {
    const fallback = fallbackOpenInNewTab(parsedUrl.toString());
    if (fallback.ok) return fallback;
    return fallback.reason === "popup-blocked" ? fallback : { ok: false, reason: "fetch-failed" };
  }
}

