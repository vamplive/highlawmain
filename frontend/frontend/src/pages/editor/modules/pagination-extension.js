/**
 * 시각적 페이지네이션 확장 (Visual Pagination Extension)
 * 에디터 콘텐츠에 페이지 나누기 위치 정보를 전달하는 ProseMirror 플러그인.
 * EditorPage에서 계산한 pageBreak 정보를 트랜잭션 메타로 받아 데코레이션을 적용한다.
 */
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/** 플러그인 키 — 외부에서 setMeta로 breaks 정보를 전달할 때 사용 */
export const visualPaginationKey = new PluginKey("visualPagination");

function px(value, fallback = 0) {
  const n = Number(value);
  return `${Number.isFinite(n) ? n : fallback}px`;
}

function appendRunningText(parent, className, text) {
  if (!text) return;
  const el = document.createElement("div");
  el.className = `editor-page-gap-running-text ${className}`;
  el.textContent = text;
  parent.appendChild(el);
}

function appendCornerGuides(parent, spec, isTop) {
  const yClass = isTop ? "top" : "bottom";
  const top = isTop ? 0 : Number(spec.marginBottom || 0) - 1;
  const bottom = isTop ? Number(spec.marginTop || 0) - 1 : 0;
  const left = Number(spec.marginLeft || 0);
  const right = Number(spec.marginRight || 0);

  for (const side of ["left", "right"]) {
    const guide = document.createElement("span");
    guide.className = `editor-page-gap-guide ${yClass} ${side}`;
    guide.style[yClass] = "0px";
    guide.style[side] = px(side === "left" ? left : right);
    if (isTop) guide.style.top = px(top);
    else guide.style.bottom = px(bottom);
    parent.appendChild(guide);
  }
}

/**
 * 페이지 경계에 삽입할 ProseMirror widget DOM을 만든다.
 * 사용자 입력인 header/footer 텍스트는 textContent로만 주입한다.
 */
export function createPageGapNode(spec = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = "editor-page-gap";
  wrapper.dataset.pageGap = "true";
  wrapper.contentEditable = "false";
  wrapper.style.width = px(spec.pageWidth);
  wrapper.style.marginLeft = `-${px(spec.marginLeft)}`;
  wrapper.style.marginRight = `-${px(spec.marginRight)}`;
  wrapper.style.pointerEvents = "none";
  wrapper.style.setProperty("--page-gap-page-bg", spec.pageBg || "#fff");
  wrapper.style.setProperty("--page-gap-canvas-bg", spec.canvasBg || "#e8e8e8");
  wrapper.style.setProperty("--page-gap-label", spec.labelColor || "#aaa");
  wrapper.style.setProperty("--page-gap-guide", spec.guideColor || "#c0c0c0");

  const footer = document.createElement("div");
  footer.className = "editor-page-gap-surface footer";
  footer.style.height = px(spec.marginBottom);
  appendRunningText(footer, "footer-text", spec.footerText);
  appendCornerGuides(footer, spec, false);

  const separator = document.createElement("div");
  separator.className = "editor-page-gap-separator";
  separator.style.height = px(spec.pageGap, 20);
  separator.style.boxShadow = `inset 0 1px 0 ${spec.shadowColor || "rgba(0,0,0,0.08)"}, inset 0 -1px 0 ${spec.shadowColor || "rgba(0,0,0,0.08)"}`;
  separator.textContent = `${spec.afterPage || 1} / ${spec.page || 2}`;

  const header = document.createElement("div");
  header.className = "editor-page-gap-surface header";
  header.style.height = px(spec.marginTop);
  appendRunningText(header, "header-text", spec.headerText);
  appendCornerGuides(header, spec, true);

  wrapper.append(footer, separator, header);
  return wrapper;
}

function buildDecorationSet(state, breaks = []) {
  const docSize = state.doc.content.size;
  const decorations = breaks
    .filter((spec) => spec && Number.isFinite(Number(spec.pos)))
    .map((spec) => {
      const pos = Math.max(0, Math.min(docSize, Number(spec.pos)));
      const key = `pgap-${pos}-${spec.page || ""}-${spec.afterPage || ""}`;
      return Decoration.widget(pos, () => createPageGapNode(spec), { side: -1, key });
    });
  return DecorationSet.create(state.doc, decorations);
}

/**
 * VisualPagination TipTap 확장
 * - 페이지 나누기 위치를 받아 에디터 상태에 저장한다.
 * - EditorPage의 applyPageBreaks에서 계산된 breaks 배열을
 *   트랜잭션 메타로 전달하면, 플러그인이 이를 상태로 보관한다.
 */
export const VisualPagination = Extension.create({
  name: "visualPagination",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: visualPaginationKey,

        state: {
          init() {
            return { breaks: [] };
          },
          apply(tr, prev) {
            const meta = tr.getMeta(visualPaginationKey);
            if (meta) return meta;
            return prev;
          },
        },

        props: {
          decorations(state) {
            const paginationState = visualPaginationKey.getState(state);
            return buildDecorationSet(state, paginationState?.breaks || []);
          },
        },
      }),
    ];
  },
});
