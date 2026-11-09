# 玻璃版技术状态固化 — 2026-11-11 v2

这是一份**已被用户验收**的快照。用途：后续任何人（包括子代理）把玻璃改坏时，可以一键回到这里。

- 源文件：`<project-root>\theme-glass.js`
- 部署副本：`<portable-install>\profile\webview-ui\default\fe\0.3.0\glass-acrylic.js`
- 两者必须**字节相同**，SHA-256 = `f76fa752bec0ae66d8200efcb7b7e40090cb6e29c88ef98f75a0ca3d8aaffd2c`（16,199 B）

## v2 相对 v1（15,339 B / `1d22877c…`）只改了胶囊

| 项 | v1 | v2 |
| --- | --- | --- |
| 深色播放胶囊底色 | `rgba(14,14,14,0.80)` | **`rgba(14,14,14,0.34)`** |
| 浅色播放胶囊 | 主题自带的不透明白胶囊（无模糊） | **显式规则 `rgba(250,250,250,0.34)` + `blur(30px) saturate(175%)`** |

其余所有表面（`_root_obom2` 0.16/0.38、`_fill_td4ka` 0.42/0.28、卡片模糊、遮罩 0.55 + 24px、顶栏胶囊、隐藏项、`position:absolute`）与 v1 完全一致。

## 本版固化的关键数值（改动前先对照这张表）

| 项 | 选择器 / 常量 | 深色 | 浅色 |
|---|---|---|---|
| 外壳涂层 | `_root_obom2` | `rgba(28,28,28,0.16)` | `rgba(232,232,232,0.38)` |
| 卡片磨砂填充 | `_fill_td4ka` | `rgba(20,20,20,0.42)` | `rgba(255,255,255,0.28)` |
| 卡片模糊 | `_edge_td4ka` | `blur(24px) saturate(150%) brightness(1.05)` | 同左 |
| 对话框遮罩 | `fui-DialogSurface__backdrop` | `rgba(0,0,0,0.55)` + `blur(24px) saturate(130%)` | 同左 |
| 对话框面板 | `fui-DialogSurface:not(__backdrop)` | `rgba(24,24,24,0.94)` | `rgba(252,252,252,0.94)` |
| 顶栏按钮胶囊 | `_tools_modh4` / `_capsule_zmyg1` | `rgba(20,20,20,0.55)` | `rgba(255,255,255,0.62)` |
| 播放胶囊 | `_root_hmwti_4` | `rgba(14,14,14,0.34)` + `blur(30px) saturate(175%)` | `rgba(250,250,250,0.34)` + `blur(30px) saturate(175%)` |
| 胶囊定位 | `_root_hmwti_4` | **`position: absolute`（主题原值，禁止改 relative）** | 同左 |

### 三条硬约束（踩过坑，别再动）

1. **胶囊绝不能改成 `position: relative`**。主题里它是 `absolute` 浮在底部；改 relative 会把它拽进文档流，内容区被压短 64px（正好一个胶囊高），深浅模式显示区域就不一样大了。
2. **不要用 `[class*="td4ka"]`、`[class*="fui-DialogSurface"]` 这种前缀选择器**。`td4ka` 是卡片模块（root/edge/fill），`fui-DialogSurface` 是 `fui-DialogSurface__backdrop` 的前缀；两者都会把整屏刷成实心板，表现为"全屏不透明"。
3. **不要写 `darkMode: true`**。`applyMaterial()` 必须沿用 `getBackdropPolicy()` 返回的 `darkMode`，否则会跟主题的颜色模式打架，出现模式自己乱跳、切浅色被改回深色。

### 仍被刻意隐藏的两项

- `胶囊背景模糊`：只隐藏该**行**（`_footer_o3g21_78`）。早期版本误藏了它的父节点，结果把整个 `播放栏位置`（窗口底部 / 标题栏 / 胶囊）一起藏了。
- `窗口背景`（背景来源 + 材质）：整卡隐藏（`_root_1m40a` 按标题匹配，不能按位置）。
- 保留可见：`播放栏位置` 三选一、`颜色模式`、`强调色`。

### 标题栏 / 全屏说明（v2 新增）

- 标题栏模式下主题是否显示播放栏，由**窗口宽度**决定（1008 px 断点），与是否全屏无关；这是主题自身的行为，shim 不改。
- 普通窗口想要底部胶囊，请在 `播放栏位置` 选「胶囊」。

## 恢复步骤

```powershell
$rel = '<release-snapshot>'
$dst = '<portable-install>\profile\webview-ui\default\fe\0.3.0'

# 1) 先核对快照自身完整性（应当全部 OK）
cd $rel; (Get-FileHash theme-glass.js -Algorithm SHA256).Hash
# 期望 f76fa752bec0ae66d8200efcb7b7e40090cb6e29c88ef98f75a0ca3d8aaffd2c

# 2) 还原 shim（源 + 部署）
Copy-Item "$rel\theme-glass.js" '<project-root>\theme-glass.js' -Force
Copy-Item "$rel\glass-acrylic.deployed.js" "$dst\glass-acrylic.js" -Force

# 3) 确认 index.html 仍注入 shim（必须在 </body> 前有这一行）
Select-String -Path "$dst\index.html" -Pattern 'glass-acrylic.js'

# 4) 重载页面（必要时重启 foobar2000）
# 在开发机上重载 WebView 页面，或直接重启 foobar2000
```

## 还原后必须验证的 4 项

```powershell
# 开发机工具目录
# 在开发机上运行页面自检脚本
```

期望输出（深色为例）：

```
windowBgCard     hidden-by:_root_1m40a_2      <- 窗口背景 整卡隐藏（预期）
playbackBar      visible:h=...                <- 播放栏位置 可见
optBottom / optTitle / optCapsule  visible     <- 三选一都可见
capsuleBlurRow   hidden-by:_footer_o3g21_78   <- 只隐藏这一行
```

再补一条几何检查（深浅必须一致）：

```js
document.querySelector('._root_hmwti_4').getBoundingClientRect()   // position 必须是 absolute
document.querySelector('[class*="_scroller_19syc"]').getBoundingClientRect().height  // 深浅都是 466
```

## 快照清单

见同目录 `SHA256SUMS.txt`：`theme-glass.js`、`glass-acrylic.deployed.js`、`fe-0.3.0-index.html`、
`README-中文.md`、`RESTORE.md`、`delivery-inventory.txt`、`FINAL_dark_cropped.png`、`FINAL_light_cropped.png`。

`FINAL_dark_cropped.png` / `FINAL_light_cropped.png` 是本版深浅两模式的验收截图（同一窗口尺寸，为保护隐私裁掉了底部 140 px 的播放胶囊区域）。
