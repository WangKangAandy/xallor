# AGENTS.md — AI 协作说明

本文件面向在本仓库中协助开发的 AI 代理与人类开发者，概括技术栈、目录约定与常见任务。

## 项目是什么

- **名称**：xallor（由 Figma 设计导出的前端代码包；设计稿见 [Figma](https://www.figma.com/design/yT1E09G5b0sOq8oU02cLUt/Chrome-New-Tab-Page-UI--Community-)）。
- **形态**：单页 **React** 应用，由 **Vite 6** 开发与构建；无独立后端。

## 技术栈（与修改代码相关）

| 领域 | 选型 |
|------|------|
| 运行时 | React 18（`package.json` 中为 peer，需已安装） |
| 构建 | Vite 6、`@vitejs/plugin-react` |
| 样式 | Tailwind CSS 4（`@tailwindcss/vite` 插件）、全局样式在 `src/styles/` |
| UI 组件 | `src/app/components/ui/`：Radix UI + `class-variance-authority` + `tailwind-merge`（`cn` 工具），风格接近 shadcn |
| 其他依赖 | MUI / Emotion、Motion、Recharts、react-dnd 等（按功能按需使用，勿在未使用时批量删除） |

**重要**：[`vite.config.ts`](vite.config.ts) 中注释说明 **React 与 Tailwind 两个插件均为必需**，即使当前未大量使用 Tailwind 也不要移除。

## 路径与入口

- **HTML 入口**：[index.html](index.html) → `/src/main.tsx`
- **应用根组件**：[src/app/App.tsx](src/app/App.tsx)（布局：背景、[`Sidebar`](src/app/components/Sidebar.tsx)、[`SearchBar`](src/app/components/SearchBar.tsx)、[`DesktopGrid`](src/app/components/DesktopGrid.tsx)）
- **路径别名**：`@` → `src`（在 Vite 中配置；导入示例：`import X from '@/app/...'`）

## 目录结构（简图）

```text
src/
  main.tsx                 # createRoot 挂载
  app/
    App.tsx                # 页面壳与主布局
    components/            # 业务组件（桌面网格、侧栏、搜索等）
      figma/               # 与导出相关的辅助（如 ImageWithFallback）
      ui/                  # 可复用基础组件（按钮、对话框等）
  styles/
    index.css              # 聚合 fonts / tailwind / theme
    tailwind.css, theme.css, fonts.css
```

新增功能时：优先在 `src/app/components/` 下按职责拆文件；通用控件放在 `ui/` 并沿用现有 `cn` + Radix 模式。

## 编码约定

- **组件**：函数组件；与现有文件一致地使用双引号或单引号（当前混用，新代码跟随邻近文件）。
- **样式**：优先 Tailwind 类名；主题变量在 `src/styles/theme.css` 与 Tailwind 配置链路中。
- **类型**：仓库根目录可能无 `tsconfig.json`（依赖 Vite/编辑器推断）；新增 `.ts`/`.tsx` 时保持与周围文件一致的模块解析方式。
- **图片与外链**：注意 `App.tsx` 等处的 Unsplash 等外部 URL；替换资源时考虑版权与加载失败（可参考 `figma/ImageWithFallback.tsx`）。

## 常用命令

```bash
npm install    # 安装依赖
npm run dev    # 开发服务器（默认多为 http://localhost:5173）
npm run build  # 产出 dist/
```

若根目录 [`package.json`](package.json) 中 `dev`/`build` 使用 `node ./node_modules/vite/bin/vite.js`，这是在部分环境下 **`node_modules/.bin` 未正确生成** 时的兼容写法；若本机 `vite` 命令可用，也可按需改回 `"dev": "vite"`。

**peer 依赖**：若运行时报错找不到 `react` / `react-dom`，请安装与 peer 一致的版本，例如：

```bash
npm install react@18.3.1 react-dom@18.3.1
```

## 给代理的操作原则

- 改动范围尽量贴合需求；不随意删除 `ui/` 下未使用的组件（可能为设计系统预留）。
- 修改构建配置前阅读 [`vite.config.ts`](vite.config.ts) 中的注释与别名。
- 不要编辑本文件来替代 README；用户向外的「如何运行」仍以 [README.md](README.md) 为准。
