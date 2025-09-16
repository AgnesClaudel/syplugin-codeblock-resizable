# 可拖拽代码块高度（SiYuan 插件）

为思源笔记的代码块添加“可拖拽高度”功能，支持鼠标或触屏上下拖动调整高度，超出内容可滚动查看。适配桌面与移动端，支持多前后端环境。

- 插件名：syplugin-codeblock-resizable
- 版本：0.1.0
- 最低适配版本：SiYuan ≥ 2.8.9
- 支持平台：Windows / Linux / macOS / Docker / Android / iOS
- 支持前端：桌面端、桌面窗口、移动端、浏览器桌面、浏览器移动端

## 功能特性

- 在代码块底部提供一个不可见的拖拽热区（默认 10px 高），将鼠标移至该区域时光标显示为上下拉伸样式，按住即可拖拽调整高度。
- 初始最大高度为 600px，超过部分支持滚动查看。
- 支持鼠标拖动与触控拖动（移动端手势）。
- 自动监听文档变化，新增的代码块会自动增强。
- 修复两处常见问题：
    1) 拖动超过默认区域后，默认底部分隔线不再残留。
    2) 二次拖动现在以“最新的底部边缘”为起点，而非旧的默认边缘。

## 安装

1. 将本插件放入思源插件目录（一般为 data/plugins/）。
2. 进入思源设置 → 插件 → 启用本插件。
3. 刷新或重启后生效。

## 使用说明

- 在任意代码块底部会出现一条浅色可拖拽区域。
- 将鼠标移至该区域（光标会变为上下拉伸样式），按住并拖动即可调整高度。
- 触屏设备上用手指在该区域按住并上下拖动即可。
- 调整后会以固定高度显示，你也可以再次拖动微调。

## 配置项

目前通过默认样式与逻辑工作，如需自定义可修改 index.js 中的常量：
- DEFAULT_MAX：初始最大高度（px）。
- MIN_H / MAX_H：拖拽可设置的最小/最大高度（px）。
- HOTZONE：底部拖拽热区高度（px）。

## 兼容性说明

- 插件通过 MutationObserver 自动扫描新增代码块，并在常见结构上生效：
    - .protyle-wysiwyg .code-block
    - .b3-typography .code-block
    - [data-type="NodeCodeBlock"]
    - pre（兜底）
- 若你的主题为代码块添加了特殊的阴影或底部分隔线，插件已尝试覆盖；如仍有残留，可自行在样式中追加更具体的选择器进行覆盖。

## 卸载/禁用

- 在思源设置 → 插件中禁用或卸载即可。
- 插件会清理注入的样式与临时结构，并尽可能还原代码块样式与尺寸属性（包含恢复 height/max-height/cursor 等）。

## 问题反馈

- 欢迎发邮件到huopo@foxmail.com提供反馈，我将不定期随缘进行更新。

---

## 赞助我

如果这个插件对你有帮助，可以请我喝杯蜜雪冰城，感谢支持！

你可以使用以下方式进行赞助：

<div style="display:flex; flex-direction:column; align-items:center; gap:12px; margin:12px 0;">
  <img src="./images/alipay.png" alt="" style="width:220px; max-width:90vw; height:auto; display:block;" />
  <img src="./images/wechat.png" alt="" style="width:220px; max-width:90vw; height:auto; display:block;" />
</div>
