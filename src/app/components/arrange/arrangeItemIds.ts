export function createFolderSiteArrangeId(folderId: string, siteUrl: string): string {
  return `folder:${folderId}:site:${encodeURIComponent(siteUrl)}`;
}

export type ParsedFolderSiteArrangeId = {
  folderId: string;
  siteUrl: string;
};

/**
 * 将组合 id 解析回文件夹与站点 URL；格式不匹配时返回 null。
 */
export function parseFolderSiteArrangeId(id: string): ParsedFolderSiteArrangeId | null {
  const prefix = "folder:";
  const marker = ":site:";
  if (!id.startsWith(prefix)) return null;
  const markerIndex = id.indexOf(marker, prefix.length);
  if (markerIndex <= prefix.length) return null;
  const folderId = id.slice(prefix.length, markerIndex);
  const encodedSiteUrl = id.slice(markerIndex + marker.length);
  if (!encodedSiteUrl) return null;
  try {
    return {
      folderId,
      siteUrl: decodeURIComponent(encodedSiteUrl),
    };
  } catch {
    return null;
  }
}

