# BUILD-NOTES — 构建、注入与补丁说明

## 版本

| 项 | 值 |
| --- | --- |
| 版本 | **v2**（2026-11-11） |
| shim | `theme-glass.js` = `glass-acrylic.deployed.js` = 16,199 B，SHA-256 `f76fa752bec0ae66d8200efcb7b7e40090cb6e29c88ef98f75a0ca3d8aaffd2c` |
| v2 相对 v1 | 只改播放胶囊：深色 `rgba(14,14,14,0.80)` → `rgba(14,14,14,0.34)`；浅色新增显式胶囊规则 `rgba(250,250,250,0.34)` + `blur(30px) saturate(175%)`（此前是主题自带的不透明白胶囊、无模糊） |
| 主题 | `foo-webview-default-theme` 0.3.0（AGPL-3.0-only） |

本仓库只放**补丁脚本、说明和截图**，不含 foobar2000 本体或组件二进制。

## 1. 基线

| 项 | 版本 / 说明 |
| --- | --- |
| foobar2000 | **2.26.2 x64**（portable 模式） |
| 组件 | `foo_ui_webview2` **2.1.0**（GPL-3.0） |
| 主题 | `foo-webview-default-theme` **0.3.0**（AGPL-3.0-only） |

## 2. 玻璃脚本的注入

- 部署目标：`profile\webview-ui\default\fe\0.3.0\glass-acrylic.js`
- 注入方式只有一处：`profile\webview-ui\default\fe\0.3.0\index.html` 的
  `</body>` 之前加一行

  ```html
  <script src="./glass-acrylic.js"></script>
  ```

- 脚本是一个立即执行函数（`'use strict'`），不改主题的布局与组件树，只做三类副作用：
  1. 写一个 `<style id="fb2k-glass-skin">`（材质/半透明/胶囊/遮罩规则，按当前深浅色取值）；
  2. 写一个 `<style id="fb2k-glass-layout">`（侧栏播放列表区块的 `overflow` 裁剪，修文字重叠）；
  3. 把设置里的「窗口背景」整卡、「胶囊背景模糊」行隐藏（按标题/文案匹配，不按位置）。
- 材质看门狗：每 900 ms 检查一次 `window.getBackdropPolicy()`，材质不是 `acrylic` 就补回去；
  另外在 `visibilitychange` / `focus` 时各补一次。

## 3. 主题资源与 AGPL

- **本版不包含任何主题资源补丁**：标题栏/全屏的尝试已完全回退，`assets/lyricsIntegration-CU-81lCS.js`
  保持上游原始文件（446,895 B，SHA-256 `8db5c60a3b7e1a1ac44acc7243076ab20492842028ccfffb4063502c048d347f`）。
- `fe-0.3.0.index.html` 是唯一被修改的主题文件（只在 `</body>` 前加了一行 `<script>`），
  属于 AGPL-3.0-only 主题 `foo-webview-default-theme` 0.3.0 的本地修改版，仍按 AGPL-3.0 提供；
  对照上游原版即可看到唯一差异。
- 标题栏模式由主题按窗口宽度（1008 px 断点）决定，与是否全屏无关；普通窗口想要底部胶囊在
  `播放栏位置` 选「胶囊」即可（见 README 已知限制）。

## 4. 冻结与恢复

- 恢复流程以 `RESTORE.md` 为准：先核对快照哈希，再还原 shim 与 `index.html`，最后按 RESTORE.md 的 4 项检查验收。
- 改坏了先回滚，不要在坏状态上继续调数值。

## 5. 页面截图

- `screenshots/` 为「设置 → 外观」页的深/浅两模式整窗截图，底部保留磨砂播放胶囊。
