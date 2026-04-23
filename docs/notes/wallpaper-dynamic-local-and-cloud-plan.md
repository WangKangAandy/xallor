# 动态壁纸（本地视频 / 云端）实施方案

本文档描述在**不破坏现有「静态图 Data URL + `RemoteBackgroundImage`」**前提下，扩展**动态壁纸**（以本地视频为首期，云端 URL 为后续）的架构、存储、渲染与交付顺序。与 [`wallpaper-cloud-service-plan.md`](./wallpaper-cloud-service-plan.md)（待建：纯云端目录/同步）互补：本文侧重**客户端媒体类型与渲染管线**；云端契约以该文为准。

**当前代码事实（基线）**

- 本地上传仅允许图片 MIME：`src/app/localUpload/validateLocalImageFile.ts`。
- 壁纸偏好为 `wallpaperDataUrl: string | null`，经 `UserLocalAssetsContext` 持久化；全屏背景走 `AppBackgroundLayer` → `RemoteBackgroundImage`（`Image()` 预加载，适合 `http(s)` / `data:image` / `blob:` 图片语义）。
- 将整段视频 base64 写入 `localStorage` **不可行**（配额与体积）。

---

## 1. 目标与边界

| 维度 | 首期建议 | 后续可扩展 |
|------|-----------|------------|
| 动态源形态 | 本地文件：`video/mp4`、`video/webm`（MIME 白名单可配置） | 云端 CDN URL、Lottie（JSON + 运行时）、多清晰度 |
| 静态图 | 保持现有 JPEG/PNG/WebP/GIF/SVG 路径与校验 | 可选统一改为 Blob + IDB，非必须 |
| 明确不做（首期） | 把整个视频以 Data URL 存 `localStorage` | — |

---

## 2. 数据模型（与现状兼容）

将「当前壁纸」从单一字符串抽象为 **discriminated union**（名称示意，实现时放在 `src/app/localUpload/` 或 `src/app/wallpaper/` 下独立类型文件）：

```ts
type WallpaperSource =
  | { kind: "builtin" }  // 与现有 setWallpaperDataUrl(null) 语义对齐
  | { kind: "image"; dataUrl: string }  // 兼容现有持久化键；迁移时读取旧键即可
  | { kind: "video"; blobUrl: string; storageKey: string }  // blob 仅内存；storageKey 指向 IDB/OPFS 记录
  | { kind: "remote"; url: string; media: "image" | "video"; poster?: string };  // 云端阶段
```

- **静态图**：可继续沿用 Data URL；若以后要减 `localStorage` 体积，再迁「元数据 + IDB Blob」不阻塞动态能力。
- **本地视频**：
  - 运行时：`URL.createObjectURL(file)` → 赋给 `<video src>`。
  - 持久化：**IndexedDB** 存 `Blob`（推荐），或 **OPFS** 存文件、仅持久化键/路径；`localStorage` 只存轻量 JSON（`kind` + `storageKey` + 可选 `poster` data URL 缩略图）。
- **卸载**：路由或偏好切换时 `URL.revokeObjectURL(blobUrl)`，避免泄漏。

---

## 3. 渲染层

新增薄组件（示意名 **`DesktopWallpaperSurface`**），由 `AppBackgroundLayer` 使用：

| `kind` | 行为 |
|--------|------|
| `builtin` / `image`（data/http 图） | 继续委托现有 `RemoteBackgroundImage`（或内联等价逻辑），保证弱网/候选策略与现网一致。 |
| `video`（blob 或 https） | 全屏 `<video>`：`autoPlay` `muted` `loop` `playsInline`，`object-fit: cover`；与现有 `GlassSurface` 页罩层叠放顺序不变（视频最底、罩层在上）。 |
| `remote` + `media: "video"` | 同上；注意 **CORS**（`crossOrigin`）与 CDN 是否允许新标签页来源。 |

**体验约束**

- **自动播放策略**：必须 `muted` + `playsInline`；首次播放可在用户「应用壁纸」手势后触发以降低失败率。
- **省电**：`document.visibilityState === "hidden"` 时 `pause()`，可见时再 `play()`。
- **减少动效**：`prefers-reduced-motion: reduce` 时仅显示 `poster` 或首帧静态图，不循环播放。
- **首屏**：可先展示 `poster`（可选：canvas 截首帧为 data URL 存元数据），再加载/播放视频。

---

## 4. 上传与校验（设置 UI）

- 与「仅图片」的 `LocalFileUploadButton` 分流：同一入口内根据 MIME/扩展名走 **图片管线** / **视频管线**，或拆两个按钮并在 i18n 中写清能力边界。
- 新增 `validateLocalVideoFile`：最大体积（如可配置 30–80MB）、可选最大时长、可选最大分辨率；错误映射到 `MessageKey` 与现有 toast 模式一致。
- `accept`：`video/mp4,video/webm`（按产品收窄）。

---

## 5. 与云端壁纸的衔接

云端目录项携带 `mime` 或 `media: "image" | "video"`；客户端解析为同一 `WallpaperSource` union，预览区与全屏层共用 `DesktopWallpaperSurface`。收藏/同步序列化时携带 `kind` + 引用（URL 或 `storageKey`），**禁止**把大文件内联进同步 JSON。

详细 API、缓存版本与冲突策略见 **`wallpaper-cloud-service-plan.md`**（待建时与本文件互链）。

---

## 6. 建议实施顺序

1. **类型 + 持久化迁移**：引入 `WallpaperSource`；读取旧 `wallpaperDataUrl` 键迁移为 `{ kind: "image", dataUrl }`；默认仍为 builtin。
2. **IDB 模块**：`wallpaperBlobStore`（put/get/delete + 版本号），单测覆盖配额错误路径（mock）。
3. **`DesktopWallpaperSurface`**：`AppBackgroundLayer` 仅分发 image/video；不动其他壳层。
4. **设置壁纸页**：本地上传视频 → 校验 → IDB 写入 → 生成 blob URL → 更新 Context；文案与 `i18n:validate` 补齐。
5. **回归测试**：Vitest：选小视频文件 → 存在 `video` 元素或 mock surface；刷新后从 IDB 恢复；切换回静态图后 revoke blob。

---

## 7. 风险与对策

| 风险 | 对策 |
|------|------|
| `localStorage` 存视频 | 禁止；元数据 + IDB/OPFS only |
| IDB 配额满 | 明确错误文案；引导缩小文件或清理 |
| 自动播放被拦截 | `muted` + `playsInline` + 用户手势后 `play()` |
| 扩展页 / `file://` 差异 | 在目标环境（MV3 新标签页）实测 blob 生命周期与 CSP |

---

## 8. 相关代码入口（落地时更新）

| 区域 | 路径 |
|------|------|
| 校验 | `src/app/localUpload/validateLocalImageFile.ts`；新增 `validateLocalVideoFile.ts` |
| 持久化 | `src/app/localUpload/UserLocalAssetsContext.tsx`、`userLocalAssetStorage.ts` |
| 背景 | `src/app/appShell/AppBackgroundLayer.tsx`、`src/app/components/feedback/RemoteBackgroundImage.tsx` |
| 设置 UI | `src/app/components/SettingsWallpaperPanel.tsx`、本地上传按钮与 `LocalFileUploadButton` 扩展或并列组件 |

---

## 9. 文档维护

- 首版能力合入后：在 [`project-gaps-and-roadmap.md`](../project-gaps-and-roadmap.md)「产品焦点 / 相关文件」中勾掉与本项对应的待办，并链接本文件。
- 云端专项建文后：在本文 §5 与 [`wallpaper-cloud-service-plan.md`](./wallpaper-cloud-service-plan.md) 双向互链。
