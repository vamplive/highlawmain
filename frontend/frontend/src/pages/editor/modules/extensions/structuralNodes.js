/**
 * 구조 노드 확장 모듈
 * PageBreak, SectionBreak, ColumnBreak, Bookmark 등
 * 문서의 물리적/논리적 구조를 정의하는 블록/인라인 노드 확장.
 */
import { Node } from "@tiptap/core";

/**
 * 페이지 나누기 노드 확장
 * Ctrl+Enter로 페이지 구분선을 삽입한다.
 */
export const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,

  parseHTML() {
    return [{ tag: 'div[data-type="page-break"]' }];
  },

  renderHTML() {
    return ["div", { class: "page-break", "data-type": "page-break" }];
  },

  addCommands() {
    return {
      /** @returns {boolean} 체인 호환용 */
      setPageBreak:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name }),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Enter": () => this.editor.commands.setPageBreak(),
    };
  },
});

/** 섹션 나누기에 사용할 수 있는 유형 */
const SECTION_BREAK_TYPES = ["next-page", "continuous", "even-page", "odd-page"];

/**
 * 섹션 나누기 노드 확장
 * 문서를 논리적 섹션으로 분리하며, 섹션별 레이아웃 설정이 가능하다.
 *
 * @param {string} sectionType - "next-page" | "continuous" | "even-page" | "odd-page"
 */
export const SectionBreak = Node.create({
  name: "sectionBreak",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      sectionType: {
        default: "next-page",
        parseHTML: (el) => el.getAttribute("data-section-type") || "next-page",
        renderHTML: (attrs) => ({ "data-section-type": attrs.sectionType }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="section-break"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        class: "section-break",
        "data-type": "section-break",
        ...HTMLAttributes,
      },
    ];
  },

  addCommands() {
    return {
      /**
       * 섹션 나누기를 삽입한다.
       * @param {string} type - 섹션 나누기 유형 (기본값: "next-page")
       */
      setSectionBreak:
        (type = "next-page") =>
        ({ commands }) => {
          const sectionType = SECTION_BREAK_TYPES.includes(type) ? type : "next-page";
          return commands.insertContent({
            type: this.name,
            attrs: { sectionType },
          });
        },
    };
  },
});

/**
 * 열(컬럼) 나누기 노드 확장
 * 다단 레이아웃에서 다음 열로 콘텐츠를 이동시킨다.
 */
export const ColumnBreak = Node.create({
  name: "columnBreak",
  group: "block",
  atom: true,

  parseHTML() {
    return [{ tag: 'div[data-type="column-break"]' }];
  },

  renderHTML() {
    return ["div", { class: "column-break", "data-type": "column-break" }];
  },

  addCommands() {
    return {
      setColumnBreak:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name }),
    };
  },
});

/**
 * 책갈피(Bookmark) 인라인 노드 확장
 * 문서 내 특정 위치에 이름 있는 앵커를 삽입하여, 하이퍼링크 대상으로 사용한다.
 * 너비가 0인 인라인 요소로 렌더링된다.
 */
export const Bookmark = Node.create({
  name: "bookmark",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-bookmark-id"),
        renderHTML: (attrs) => ({ "data-bookmark-id": attrs.id }),
      },
      name: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-bookmark-name"),
        renderHTML: (attrs) => ({ "data-bookmark-name": attrs.name }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span.bookmark-anchor" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", { class: "bookmark-anchor", ...HTMLAttributes }];
  },

  addCommands() {
    return {
      /**
       * 현재 커서 위치에 책갈피를 삽입한다.
       * @param {string} name - 책갈피 이름 (고유해야 함)
       */
      setBookmark:
        (name) =>
        ({ commands }) => {
          const bookmarkId = `bm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          return commands.insertContent({
            type: this.name,
            attrs: { id: bookmarkId, name },
          });
        },

      /**
       * 지정된 이름의 책갈피를 문서에서 제거한다.
       * @param {string} name - 제거할 책갈피 이름
       */
      removeBookmark:
        (name) =>
        ({ tr, state, dispatch }) => {
          let removed = false;
          state.doc.descendants((node, pos) => {
            if (node.type.name === this.name && node.attrs.name === name) {
              tr.delete(pos, pos + node.nodeSize);
              removed = true;
              // 첫 번째 매칭만 삭제하고 종료
              return false;
            }
          });
          if (removed && dispatch) dispatch(tr);
          return removed;
        },
    };
  },
});
