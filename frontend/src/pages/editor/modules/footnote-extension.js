/**
 * Footnote Extension for Tiptap
 *
 * FootnoteReference: 본문 내 위첨자 번호 (인라인 atomic 노드)
 * 각주 내용은 별도 React state로 관리 (ProseMirror 밖)
 *
 * 번호는 문서 순서 기반 자동 계산
 * 삭제 시 나머지 각주 번호 자동 재계산
 * 번호 형식: 1,2,3 / i,ii,iii / a,b,c / *, †, ‡ 지원
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { FLASH_DURATION_MS } from "../../../utils/timing";

const footnotePluginKey = new PluginKey("footnote");

/* ── 번호 형식 변환 헬퍼 ── */
const NUMBER_FORMATS = {
  decimal: (n) => String(n),
  lowerRoman: (n) => toRoman(n).toLowerCase(),
  upperRoman: (n) => toRoman(n),
  lowerAlpha: (n) => String.fromCharCode(96 + ((n - 1) % 26) + 1),
  upperAlpha: (n) => String.fromCharCode(64 + ((n - 1) % 26) + 1),
  symbol: (n) => {
    const symbols = ["*", "†", "‡", "§", "‖", "¶"];
    const idx = (n - 1) % symbols.length;
    const repeat = Math.floor((n - 1) / symbols.length) + 1;
    return symbols[idx].repeat(repeat);
  },
};

function toRoman(num) {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
  let result = "";
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) { result += syms[i]; num -= vals[i]; }
  }
  return result;
}

/**
 * 번호 형식에 따라 각주 번호 문자열 반환
 * @param {number} n - 순번 (1부터 시작)
 * @param {string} format - 번호 형식 키
 */
export function formatFootnoteNumber(n, format = "decimal") {
  const fn = NUMBER_FORMATS[format] || NUMBER_FORMATS.decimal;
  return fn(n);
}

export const FootnoteReference = Node.create({
  name: "footnoteReference",
  group: "inline",
  inline: true,
  atom: true, // 편집 불가, 단일 단위
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      footnoteId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-footnote-id"),
        renderHTML: (attrs) => ({ "data-footnote-id": attrs.footnoteId }),
      },
      number: {
        default: 1,
        parseHTML: (el) => parseInt(el.getAttribute("data-footnote-number")) || 1,
        renderHTML: (attrs) => ({ "data-footnote-number": attrs.number }),
      },
      /* 각주 유형: footnote(페이지 하단) / endnote(문서 끝) */
      noteType: {
        default: "footnote",
        parseHTML: (el) => el.getAttribute("data-note-type") || "footnote",
        renderHTML: (attrs) => ({ "data-note-type": attrs.noteType }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'sup[data-footnote-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const footnoteId = HTMLAttributes["data-footnote-id"] || "";
    const number = String(HTMLAttributes["data-footnote-number"] || "?");
    return [
      "sup",
      mergeAttributes(HTMLAttributes, {
        class: "footnote-ref",
      }),
      ["a", {
        id: footnoteId ? `fn-ref-${footnoteId}` : null,
        class: "blog-footnote-ref",
        href: footnoteId ? `#fn-content-${footnoteId}` : null,
      }, number],
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("sup");
      dom.className = "footnote-ref";
      dom.textContent = String(node.attrs.number);
      dom.setAttribute("data-footnote-id", node.attrs.footnoteId || "");
      dom.setAttribute("data-footnote-number", node.attrs.number);
      dom.setAttribute("data-note-type", node.attrs.noteType || "footnote");

      // Click → scroll to footnote area
      dom.addEventListener("click", (e) => {
        e.stopPropagation();
        const fnId = node.attrs.footnoteId;
        const fnEl = document.querySelector(`[data-footnote-item-id="${fnId}"]`);
        if (fnEl) {
          fnEl.scrollIntoView({ behavior: "smooth", block: "center" });
          fnEl.classList.add("footnote-item-flash");
          setTimeout(() => fnEl.classList.remove("footnote-item-flash"), FLASH_DURATION_MS);
        }
      });

      // Hover → show tooltip
      dom.addEventListener("mouseenter", () => {
        dom.classList.add("footnote-ref-hover");
        const fnId = node.attrs.footnoteId;
        const existing = document.querySelector(".footnote-tooltip");
        if (existing) existing.remove();

        const fnEl = document.querySelector(`[data-footnote-item-id="${fnId}"]`);
        if (fnEl) {
          const tooltip = document.createElement("div");
          tooltip.className = "footnote-tooltip";
          const content = fnEl.querySelector(".footnote-item-content");
          tooltip.textContent = content?.textContent || "(각주 내용 없음)";
          const rect = dom.getBoundingClientRect();
          tooltip.style.left = rect.left + "px";
          tooltip.style.top = (rect.bottom + 6) + "px";
          document.body.appendChild(tooltip);
        }
      });

      dom.addEventListener("mouseleave", () => {
        dom.classList.remove("footnote-ref-hover");
        const tooltip = document.querySelector(".footnote-tooltip");
        if (tooltip) tooltip.remove();
      });

      return {
        dom,
        update(updatedNode) {
          if (updatedNode.type.name !== "footnoteReference") return false;
          dom.textContent = String(updatedNode.attrs.number);
          dom.setAttribute("data-footnote-id", updatedNode.attrs.footnoteId || "");
          dom.setAttribute("data-footnote-number", updatedNode.attrs.number);
          dom.setAttribute("data-note-type", updatedNode.attrs.noteType || "footnote");
          return true;
        },
        destroy() {
          const tooltip = document.querySelector(".footnote-tooltip");
          if (tooltip) tooltip.remove();
        },
      };
    };
  },

  addCommands() {
    return {
      insertFootnote:
        (footnoteId, noteType = "footnote") =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: "footnoteReference",
              attrs: { footnoteId, number: 0, noteType },
            })
            .run();
        },
      removeFootnote:
        (footnoteId) =>
        ({ tr, state, dispatch }) => {
          let found = false;
          state.doc.descendants((node, pos) => {
            if (node.type.name === "footnoteReference" && node.attrs.footnoteId === footnoteId) {
              tr.delete(pos, pos + node.nodeSize);
              found = true;
              return false;
            }
          });
          if (found && dispatch) dispatch(tr);
          return found;
        },
      renumberFootnotes:
        () =>
        ({ tr, state, dispatch }) => {
          let counter = 1;
          let changed = false;
          state.doc.descendants((node, pos) => {
            if (node.type.name === "footnoteReference") {
              if (node.attrs.number !== counter) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  number: counter,
                });
                changed = true;
              }
              counter++;
            }
          });
          if (changed && dispatch) dispatch(tr);
          return true;
        },
      getFootnoteIds:
        () =>
        ({ state }) => {
          const ids = [];
          state.doc.descendants((node) => {
            if (node.type.name === "footnoteReference") {
              ids.push(node.attrs.footnoteId);
            }
          });
          return ids;
        },
    };
  },

  // Plugin to auto-renumber on every transaction
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: footnotePluginKey,
        appendTransaction(transactions, oldState, newState) {
          let hasChange = false;
          for (const tr of transactions) {
            if (tr.docChanged) { hasChange = true; break; }
          }
          if (!hasChange) return null;

          const tr = newState.tr;
          let counter = 1;
          let changed = false;
          newState.doc.descendants((node, pos) => {
            if (node.type.name === "footnoteReference") {
              if (node.attrs.number !== counter) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  number: counter,
                });
                changed = true;
              }
              counter++;
            }
          });
          return changed ? tr : null;
        },
      }),
    ];
  },
});

/** 고유한 각주 ID 생성 */
export function generateFootnoteId() {
  return "fn-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

/** 에디터 문서에서 모든 각주 참조 ID 추출 (문서 순서대로) */
export function getFootnoteIdsFromDoc(doc) {
  const ids = [];
  doc.descendants((node) => {
    if (node.type.name === "footnoteReference") {
      ids.push({
        id: node.attrs.footnoteId,
        number: node.attrs.number,
        noteType: node.attrs.noteType || "footnote",
      });
    }
  });
  return ids;
}
