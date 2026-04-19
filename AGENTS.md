# AGENTS.md — AI 协作说明

本文件面向在本仓库中协助开发的 AI 代理与人类开发者，概括技术栈、目录约定与常见任务。

## 首要原则（代理必读）

1. **未经用户明确要求，不得执行 Git 提交（`git commit`）或代替用户决定「现在该提交」**。若用户只要求改代码、排查或设计方案，完成改动后**停止**；由用户自行决定何时提交、提交信息如何写。唯一例外：用户原话明确要求你提交（或「提交一下」「commit」等明确指令）时，方可执行提交相关操作。

---

## 项目是什么

- **名称**：xallor（由 Figma 设计导出的前端代码包；设计稿见 [Figma](https://www.figma.com/design/yT1E09G5b0sOq8oU02cLUt/Chrome-New-Tab-Page-UI--Community-)）。
- **形态**：单页 **React** 应用，由 **Vite 6** 开发与构建；无独立后端。

## 技术栈（与修改代码相关）

| 领域 | 选型 |
|------|------|
| 运行时 | React 18（`react` / `react-dom` 已在 `dependencies` 中固定版本） |
| 构建 | Vite 6、`@vitejs/plugin-react` |
| 样式 | Tailwind CSS 4（`@tailwindcss/vite` 插件）、全局样式在 `src/styles/` |
| UI 组件 | 业务以 Tailwind 为主；**不再内置**整包 shadcn/`src/app/components/ui`（已移除未引用代码以减负；需要对话框等时再按需 `npx shadcn@latest add …` 或从 git 历史恢复）。 |
| 其他依赖 | Motion、react-dnd、lucide-react 等；新增重型库前评估体积与是否懒加载。 |

**重要**：[`vite.config.ts`](vite.config.ts) 中注释说明 **React 与 Tailwind 两个插件均为必需**，即使当前未大量使用 Tailwind 也不要移除。

## 路径与入口

- **HTML 入口**：[index.html](index.html) → `/src/main.tsx`
- **应用根组件**：[src/app/App.tsx](src/app/App.tsx)（布局：背景、[`Sidebar`](src/app/components/Sidebar.tsx)、[`SearchBar`](src/app/components/SearchBar.tsx)、[`MultiDesktopStrip`](src/app/components/MultiDesktopStrip.tsx) 内嵌 [`DesktopGrid`](src/app/components/DesktopGrid.tsx)）
- **路径别名**：`@` → `src`（在 Vite 中配置；导入示例：`import X from '@/app/...'`）

## 目录结构（简图）

```text
src/
  main.tsx                 # createRoot 挂载
  app/
    App.tsx                # 页面壳与主布局
    preferences/           # UI 偏好：layoutMode、openLinksInNewTab；UiPreferencesProvider
    navigation/          # 外链打开：openExternalUrlImpl、useOpenExternalUrl
    components/            # 业务组件（桌面网格、侧栏、搜索等）
      figma/               # 与导出相关的辅助（如 ImageWithFallback）
      shared/              # 如 FaviconIcon、SegmentedControl 等共享小组件
  styles/
    index.css              # 聚合 fonts / tailwind / theme
    tailwind.css, theme.css, fonts.css
```

新增功能时：优先在 `src/app/components/` 下按职责拆文件；通用控件可放 `shared/` 或独立文件，按需引入 Radix 等而非整目录拷贝。

## 编码约定

- **组件**：函数组件；与现有文件一致地使用双引号或单引号（当前混用，新代码跟随邻近文件）。
- **样式**：优先 Tailwind 类名；主题变量在 `src/styles/theme.css` 与 Tailwind 配置链路中。
- **类型**：根目录 [`tsconfig.json`](tsconfig.json) 已启用 `strict`；新增 `.ts`/`.tsx` 时保持与周围文件一致的模块解析方式。
- **图片与外链**：注意 `App.tsx` 等处的 Unsplash 等外部 URL；替换资源时考虑版权与加载失败（可参考 `figma/ImageWithFallback.tsx`）。

## 常用命令

```bash
npm install    # 安装依赖
npm run dev    # 开发服务器（默认多为 http://localhost:5173）
npm run build  # 产出 dist/
```

若根目录 [`package.json`](package.json) 中 `dev`/`build` 使用 `node ./node_modules/vite/bin/vite.js`，这是在部分环境下 **`node_modules/.bin` 未正确生成** 时的兼容写法；若本机 `vite` 命令可用，也可按需改回 `"dev": "vite"`。

若克隆后缺少 `node_modules`，执行 `npm install` 即可装齐 `react` / `react-dom`。

## 给代理的操作原则

- **Git 提交与推送**：以 **「首要原则」** 为准；未获用户明确指令前不执行 `git commit` / `git push`。
- 改动范围尽量贴合需求；删除大段依赖或生成代码前确认无引用并跑通 `npm run typecheck` / `npm run build`。
- 修改构建配置前阅读 [`vite.config.ts`](vite.config.ts) 中的注释与别名。
- 不要编辑本文件来替代 README；用户向外的「如何运行」仍以 [README.md](README.md) 为准。
- 对于排查出的高频/经典问题，简洁记录到 `docs/notes/`，便于后续复盘与排错复用。
- 每出现一个已定位的 bug/issue，必须补充至少一个测试用例覆盖该问题场景（可采用更高层级或更通用的测试，不要求只测单一 case），以防止同类回归。
- 测试命名建议使用 `should_<expected_behavior>_when_<condition>`（或同等语义结构），名称需体现行为与触发条件，避免泛化命名。
- 测试函数前需补充简短注释说明测试目的、关键前置条件与预期结果（类似函数注解），方便后续维护与回归定位。
- 对可缩放卡片容器，Framer Motion 默认使用 `layout=\"position\"`（仅位置动画）；若需启用尺寸动画，必须说明不会造成子内容拉伸并补对应回归测试。
