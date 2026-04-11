# Favicon 加载兼容记录

## 问题现象

- Chrome 下部分站点图标显示为首字母占位。
- Edge / Cursor 内置浏览器中同样页面可正常显示。

## 根因

- 旧实现只使用 `icons.duckduckgo.com/ip3` 单一来源。
- 当该来源被隐私插件、网络策略或浏览器设置拦截时，会全部回退到占位图标。

## 解决方案

- 新增共用组件：`src/app/components/shared/FaviconIcon.tsx`
- 使用多源回退链：
  1. `duckduckgo ip3`
  2. `google s2 favicons`
  3. `icon.horse`
  4. 最终回退首字母占位

## 经验

- 对外链静态资源（favicon、头像、缩略图）避免单源依赖。
- 统一抽象为共用组件，减少业务组件重复逻辑和漏改风险。

