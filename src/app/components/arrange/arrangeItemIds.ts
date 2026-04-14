export function createFolderSiteArrangeId(folderId: string, siteUrl: string): string {
  return `folder:${folderId}:site:${encodeURIComponent(siteUrl)}`;
}

