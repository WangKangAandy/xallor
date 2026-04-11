
# xallor

This is a code bundle for xallor. The original design source is available at https://www.figma.com/design/yT1E09G5b0sOq8oU02cLUt/Chrome-New-Tab-Page-UI--Community-.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Default desktop grid (bundled JSON)

The **first-time** desktop shortcuts / folders / weather widget are **not** hard-coded only in TypeScript: they are defined in a single file that is **shipped with the extension** and bundled at build time:

- **File:** [`src/app/config/defaultGrid.json`](src/app/config/defaultGrid.json)
- **Shape:** matches `GridPayload` in [`src/app/storage/types.ts`](src/app/storage/types.ts) — top-level `items` (array) and `showLabels` (boolean). Item objects follow [`src/app/components/desktopGridTypes.ts`](src/app/components/desktopGridTypes.ts) (`site`, `folder`, or `widget`).

**Behavior:**

- On first launch (or when there is no valid saved grid in `chrome.storage` / `localStorage`), the app uses this JSON as the fallback passed into `useGridPersistence`.
- After the user changes the grid, their data is persisted; updating the JSON in a **new** release only affects **new installs** or users who clear storage, unless you add migration logic later.

**Maintenance:** edit `defaultGrid.json`, run `npm run build` (or `npm run dev`) so Vite picks up changes. Prefer PR-friendly diffs on this file rather than large edits inside React components.

**中文说明：** 默认桌面图标与文件夹列表由 **内置 JSON**（随扩展打包）维护；开发者改该文件即可调整「官方默认」，用户本地已保存的布局仍以存储为准。详见上文路径与类型约束。

