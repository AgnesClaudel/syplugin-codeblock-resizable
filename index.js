"use strict";
const { Plugin } = require("siyuan");

class ResizableCodeBlockPlugin extends Plugin {
    onload() {
        // 样式：修复底部分隔线、手柄定位与滚动结构
        const css = `
/* 外层容器包裹：负责尺寸、定位与背景，去掉默认底部分隔线 */
.siyuan-resizable-code {
  position: relative;
  overflow: hidden; /* 滚动交给内部层 */
  border-radius: 6px;
  /* 覆盖主题底部分隔线/渐变：统一用容器底色 */
  background: var(--b3-theme-background, #fff);
  /* 有些主题在 code-block 上加了阴影/边框，这里尝试覆盖 */
  box-shadow: none !important;
  border-bottom: none !important;
  max-height: 600px;
}

/* 内部滚动层：承载原有代码内容，负责滚动 */
.siyuan-resizable-scroll {
  overflow: auto;
  max-height: inherit;
  height: 100%;
}

/* 兼容 pre/code 背景，防止双底色/分隔线可见 */
.siyuan-resizable-code pre,
.siyuan-resizable-code code,
.siyuan-resizable-code .hljs {
  background: transparent !important;
}

/* 拖拽手柄：绝对定位在容器“最新底部”，不再使用 sticky */
.siyuan-resize-handle {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 12px;
  cursor: ns-resize;
  background: linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.06));
  z-index: 2;
  /* 避免和滚动条重叠难点选，允许穿透但自身可点 */
  pointer-events: auto;
}

/* 深色主题微调 */
@media (prefers-color-scheme: dark) {
  .siyuan-resize-handle {
    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.10));
  }
}

/* 避免手柄遮挡底部文本：给内容底部留出内边距 */
.siyuan-resizable-code .hljs,
.siyuan-resizable-code pre,
.siyuan-resizable-code code,
.siyuan-resizable-code .siyuan-resizable-scroll {
  padding-bottom: 18px;
  box-sizing: border-box;
}

/* 拖动时禁选 */
.siyuan-resizable-code.resizing { user-select: none; cursor: ns-resize; }

/* 尝试覆盖常见主题在 code-block 底部的装饰（防止“默认分隔线”残留） */
.protyle-wysiwyg .code-block,
.b3-typography .code-block,
.code-block {
  border-bottom: none !important;
  box-shadow: none !important;
  background-image: none !important;
}
`;

        this.styleEl = document.createElement("style");
        this.styleEl.setAttribute("data-resizable-code-style", "1");
        this.styleEl.textContent = css;
        document.head.appendChild(this.styleEl);

        const WRAP = "siyuan-resizable-code";
        const SCROLL = "siyuan-resizable-scroll";
        const HANDLE = "siyuan-resize-handle";
        const DEFAULT_MAX = 600;

        const isCodeBlock = (el) => {
            if (!el || el.nodeType !== 1) return false;
            if (el.classList.contains("code-block")) return true;
            if (el.getAttribute && el.getAttribute("data-type") === "NodeCodeBlock") return true;
            if (el.tagName === "PRE") return true; // 兜底
            return false;
        };

        const wrapWithScrollLayer = (container) => {
            // 若已包裹则跳过
            if (container.querySelector(`:scope > .${SCROLL}`)) return;

            // 把现有内容搬到内部滚动层
            const scroll = document.createElement("div");
            scroll.className = SCROLL;

            // 将原内容节点移入 scroll
            while (container.firstChild) {
                scroll.appendChild(container.firstChild);
            }
            container.appendChild(scroll);
        };

        const enhance = (el) => {
            if (el.dataset.resizableApplied === "1") return;

            const container = el;
            container.classList.add(WRAP);

            // 设定初始尺寸策略
            // 保持 max-height，以便内容初始不超出时可自然撑开至 DEFAULT_MAX 以内
            if (!container.style.height && !container.style.maxHeight) {
                container.style.maxHeight = DEFAULT_MAX + "px";
            }

            // 内部滚动层
            wrapWithScrollLayer(container);

            // 手柄：绝对定位在容器底部，随着容器高度变化而变化
            if (!container.querySelector(`:scope > .${HANDLE}`)) {
                const handle = document.createElement("div");
                handle.className = HANDLE;
                container.appendChild(handle);
                attachDrag(container, handle);
            }

            el.dataset.resizableApplied = "1";
        };

        const attachDrag = (container, handle) => {
            let startY = 0, startH = 0, dragging = false;

            const start = (y) => {
                dragging = true;
                // 每次开始拖动都读取“当前真实高度”，避免使用旧高度
                startY = y;
                // 使用 offsetHeight 更直观地获得当前容器高度（包含内边距）
                startH = container.getBoundingClientRect().height;
                container.classList.add("resizing");
                document.body.style.userSelect = "none";
            };

            const move = (y) => {
                if (!dragging) return;
                const h = Math.max(120, Math.min(1200, Math.round(startH + (y - startY))));
                container.style.height = h + "px";
                container.style.maxHeight = ""; // 固定高度接管
            };

            const end = () => {
                if (!dragging) return;
                dragging = false;
                container.classList.remove("resizing");
                document.body.style.userSelect = "";
            };

            handle.addEventListener("mousedown", (e) => {
                e.preventDefault();
                e.stopPropagation();
                start(e.clientY);
                const mm = (ev) => move(ev.clientY);
                const mu = () => {
                    window.removeEventListener("mousemove", mm);
                    window.removeEventListener("mouseup", mu);
                    end();
                };
                window.addEventListener("mousemove", mm);
                window.addEventListener("mouseup", mu);
            });

            handle.addEventListener("touchstart", (e) => {
                if (e.touches.length > 1) return;
                e.preventDefault();
                e.stopPropagation();
                start(e.touches[0].clientY);
                const tm = (ev) => {
                    if (ev.touches.length > 1) return;
                    ev.preventDefault(); // 防止页面滚动干扰拖拽
                    move(ev.touches[0].clientY);
                };
                const te = () => {
                    window.removeEventListener("touchmove", tm);
                    window.removeEventListener("touchend", te);
                    window.removeEventListener("touchcancel", te);
                    end();
                };
                window.addEventListener("touchmove", tm, { passive: false });
                window.addEventListener("touchend", te);
                window.addEventListener("touchcancel", te);
            });
        };

        const scan = () => {
            const nodes = document.querySelectorAll([
                '.protyle-wysiwyg .code-block:not([data-resizable-applied="1"])',
                '.b3-typography .code-block:not([data-resizable-applied="1"])',
                '.code-block:not([data-resizable-applied="1"])',
                '[data-type="NodeCodeBlock"]:not([data-resizable-applied="1"])',
                // 兜底 pre 结构（如导出或特殊主题）
                '.protyle-wysiwyg pre:not([data-resizable-applied="1"])',
                '.b3-typography pre:not([data-resizable-applied="1"])',
                'pre:not([data-resizable-applied="1"])'
            ].join(','));

            nodes.forEach((el) => {
                if (isCodeBlock(el)) enhance(el);
            });
        };

        this.mo = new MutationObserver((muts) => {
            for (const m of muts) {
                if (m.addedNodes && m.addedNodes.length) {
                    queueMicrotask(scan);
                    break;
                }
            }
        });
        this.mo.observe(document.body, { childList: true, subtree: true });

        // 首次扫描
        scan();
        console.log("[resizable] plugin loaded");
    }

    onunload() {
        if (this.mo) {
            this.mo.disconnect();
            this.mo = null;
        }
        if (this.styleEl && this.styleEl.parentNode) {
            this.styleEl.parentNode.removeChild(this.styleEl);
            this.styleEl = null;
        }
        // 清理已添加的手柄与包装层
        document.querySelectorAll(".siyuan-resize-handle").forEach((n) => n.remove());
        document.querySelectorAll(".siyuan-resizable-code").forEach((n) => {
            // 还原内部滚动层结构：把内容移回容器
            const scroll = n.querySelector(":scope > .siyuan-resizable-scroll");
            if (scroll) {
                while (scroll.firstChild) n.appendChild(scroll.firstChild);
                scroll.remove();
            }
            n.classList.remove("siyuan-resizable-code");
            n.style.removeProperty("height");
            n.style.removeProperty("max-height");
            n.style.removeProperty("box-shadow");
            n.style.removeProperty("border-bottom");
        });

        console.log("[resizable] plugin unloaded");
    }
}

module.exports = ResizableCodeBlockPlugin;