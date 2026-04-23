import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { GridItemType, GridShape } from "./desktopGridTypes";
import { removeGridItemById, removeSiteFromFolderByUrl } from "./desktopGridItemActions";

type SetItems = Dispatch<SetStateAction<GridItemType[]>>;
type SetOpenFolderId = Dispatch<SetStateAction<string | null>>;

/**
 * 桌面网格项的增删改（重命名、改尺寸、删项）：纯 `setItems` 与打开文件夹 id 的协同，便于从 `DesktopGrid` 中拆出以降低单文件体积。
 */
export function useDesktopGridItemMutations(setItems: SetItems, setOpenFolderId: SetOpenFolderId) {
  const handleRename = useCallback(
    (id: string, newName: string) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            if (item.type === "site") {
              return { ...item, site: { ...item.site, name: newName } };
            }
            if (item.type === "folder") {
              return { ...item, name: newName };
            }
          }
          return item;
        }),
      );
    },
    [setItems],
  );

  const handleRenameInnerItem = useCallback(
    (folderId: string, siteUrl: string, newName: string) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.type === "folder" && item.id === folderId) {
            return {
              ...item,
              sites: item.sites.map((site) => (site.url === siteUrl ? { ...site, name: newName } : site)),
            };
          }
          return item;
        }),
      );
    },
    [setItems],
  );

  const handleDeleteInnerItem = useCallback(
    (folderId: string, siteUrl: string) => {
      setItems((prev) => removeSiteFromFolderByUrl(prev, folderId, siteUrl));
    },
    [setItems],
  );

  const handleResize = useCallback(
    (id: string, newShape: GridShape) => {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, shape: newShape } : item)));
    },
    [setItems],
  );

  const handleDeleteItem = useCallback(
    (id: string) => {
      setItems((prev) => removeGridItemById(prev, id));
      setOpenFolderId((cur) => (cur === id ? null : cur));
    },
    [setItems, setOpenFolderId],
  );

  return {
    handleRename,
    handleRenameInnerItem,
    handleDeleteInnerItem,
    handleResize,
    handleDeleteItem,
  };
}
