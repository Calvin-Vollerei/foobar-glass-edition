# Foobar Glass Edition

给 **foobar2000 v2.26.2 x64**（WebView2 UI + 官方默认主题 `foo-webview-default-theme` 0.3.0）做的界面补丁：
注入一个 `glass-acrylic.js`，把窗口材质固定在 Windows **Acrylic**，并给深/浅色模式做半透明玻璃、
内容卡片磨砂、顶部工具栏胶囊、播放胶囊磨砂和对话框遮罩。

> 本仓库只包含**补丁脚本、说明和截图**。
> 不含 foobar2000 本体与组件 DLL，也不含任何个人数据——网易云账号、本地曲库、播放历史、
> WebView2 用户目录（Cookies / Local Storage / History）都已刻意排除。

## 仓库内容

| 路径 | 说明 |
| --- | --- |
| `glass/theme-glass.js` | 补丁源码（与部署副本字节相同，16,199 B，SHA-256 `f76fa752…`） |
| `glass/glass-acrylic.deployed.js` | 部署到主题目录的那一份（与上面同哈希） |
| `glass/fe-0.3.0.index.html` | 主题 0.3.0 的 `index.html`，已含 `<script src="./glass-acrylic.js"></script>` |
| `screenshots/` | 深色 / 浅色验收截图（已裁掉底部播放胶囊区域，见「隐私」） |
| `docs/README-中文.md` | 完整中文说明（安装、调参、已知限制） |
| `docs/RESTORE.md` | 本版固化的关键数值与恢复步骤（改坏了先看它） |
| `docs/delivery-inventory.txt` | 原交付目录清单（组件名/大小/校验和，不含个人文件） |
| `docs/SHA256SUMS.txt` | 本仓库文件的校验和 |
| `BUILD-NOTES.md` | 构建、注入、AGPL 说明 |

## v2 相对 v1

只改播放胶囊：深色底色 `rgba(14,14,14,0.80)` → `rgba(14,14,14,0.34)`；
浅色新增显式胶囊规则 `rgba(250,250,250,0.34)` + `blur(30px) saturate(175%)`
（此前是主题自带的不透明白胶囊、没有模糊）。其余表面与 v1 一致。

## 怎么用

前提（都来自上游，本仓库不分发）：

1. foobar2000 **v2.26.2 x64**（portable 模式即可）
2. 组件 `foo_ui_webview2` **2.1.0**
3. 主题 `foo-webview-default-theme` **0.3.0**

然后：

```text
1) 把 glass/theme-glass.js 复制为
   <foobar2000>\profile\webview-ui\default\fe\0.3.0\glass-acrylic.js

2) 在 <foobar2000>\profile\webview-ui\default\fe\0.3.0\index.html 的 </body> 之前加一行：
   <script src="./glass-acrylic.js"></script>

3) 重启 foobar2000
```

## 效果与限制（摘要）

- **深色模式**：半透明玻璃 + 播放胶囊磨砂；
- **浅色模式**：更亮的半透明，卡片磨砂、胶囊磨砂、对话框遮罩同样生效；
- 设置里的「窗口背景」整卡和「胶囊背景模糊」一行被脚本接管并隐藏；「播放栏位置」三选一仍可用；
- 标题栏模式是否显示播放栏由主题按窗口宽度（1008 px 断点）决定，与是否全屏无关；
- 主题「背景来源 = 图片」启动时会报 `背景图片读取失败`，请保持「系统材质」；
- 在线音乐首次使用需要联网下载后端（约 120 MB）。

完整说明、调参数值与已知限制见 [`docs/README-中文.md`](docs/README-中文.md)。

## 隐私

- `screenshots/` 的两张图已裁掉底部 140 px 播放胶囊区域，避免带出作者正在播放的曲目与专辑封面；
- 本仓库不含 `profile\`、网易云登录态、本地曲库/播放列表、媒体库路径或 WebView2 用户数据。

## 许可与致谢

- 主题 `foo-webview-default-theme` 0.3.0：AGPL-3.0-only（上游）；
- `foo_ui_webview2` 2.1.0：GPL-3.0（上游）；
- `fe-0.3.0.index.html` 是主题文件的本地修改版（仅加一行脚本标签），仍按 AGPL-3.0 提供；
- foobar2000：freeware，**本仓库不包含其二进制**；
- 本仓库的补丁脚本与文档：作者自用整理，未附带单独的开源许可文件。
