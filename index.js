"use strict";
const { Plugin } = require("siyuan");

class ResizableCodeBlockPlugin extends Plugin {
    onload() {
        // 注入样式
        const css = `
/* 让思源的代码块容器可滚动且可调整高度 */
.siyuan-resizable-code {
  position: relative;
  overflow: auto;
  max-height: 600px;
  border-radius: 6px;
  background: inherit;
}
/* 兼容 pre 结构 */
.siyuan-resizable-code pre { margin: 0 !important; }

/* 拖拽手柄 */
.siyuan-resize-handle {
  position: sticky;
  bottom: 0; left: 0; right: 0;
  height: 12px;
  cursor: ns-resize;
  background: linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.06));
  z-index: 2;
}
.siyuan-resizable-code.resizing { user-select: none; cursor: ns-resize; }

/* 深色主题微调 */
@media (prefers-color-scheme: dark) {
  .siyuan-resize-handle {
    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.10));
  }
}

/* 避免手柄遮挡底部文本 */
.siyuan-resizable-code .hljs,
.siyuan-resizable-code pre,
.siyuan-resizable-code code {
  padding-bottom: 18px;
  box-sizing: border-box;
}
`;
        this.styleEl = document.createElement("style");
        this.styleEl.setAttribute("data-resizable-code-style", "1");
        this.styleEl.textContent = css;
        document.head.appendChild(this.styleEl);

        // 逻辑
        const WRAP = "siyuan-resizable-code";
        const HANDLE = "siyuan-resize-handle";
        const DEFAULT_MAX = 600;

        const isCodeBlock = (el) => {
            if (!el || el.nodeType !== 1) return false;
            if (el.classList.contains("code-block")) return true;
            if (el.getAttribute && el.getAttribute("data-type") === "NodeCodeBlock") return true;
            if (el.tagName === "PRE") return true; // 兜底
            return false;
        };

        const enhance = (el) => {
            if (el.dataset.resizableApplied === "1") return;

            const container = el;
            container.classList.add(WRAP);
            if (!container.style.height && !container.style.maxHeight) {
                container.style.maxHeight = DEFAULT_MAX + "px";
            }

            // 已存在手柄则不重复添加
            if (!container.querySelector("." + HANDLE)) {
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
                startY = y;
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
        // 清理样式与观察器
        if (this.mo) {
            this.mo.disconnect();
            this.mo = null;
        }
        if (this.styleEl && this.styleEl.parentNode) {
            this.styleEl.parentNode.removeChild(this.styleEl);
            this.styleEl = null;
        }
        // 尝试移除已添加的手柄类名（可选，不强制，还原界面）
        document.querySelectorAll(".siyuan-resize-handle").forEach((n) => n.remove());
        document.querySelectorAll(".siyuan-resizable-code").forEach((n) => {
            n.classList.remove("siyuan-resizable-code");
            n.style.removeProperty("height");
            n.style.removeProperty("max-height");
        });

        console.log("[resizable] plugin unloaded");
    }
}

module.exports = ResizableCodeBlockPlugin;