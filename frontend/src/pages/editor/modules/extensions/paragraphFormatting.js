/**
 * 단락 서식 확장 모듈
 * ParagraphBorder, DropCap, KeepWithNext, WidowOrphan, TextDirection 등
 * 단락 수준의 레이아웃 및 서식 속성을 정의한다.
 */
import { Extension } from "@tiptap/core";

/**
 * 선택된 단락 노드에 속성을 일괄 적용하는 헬퍼 함수
 * 여러 단락 확장에서 공통으로 사용한다.
 *
 * @param {string[]} types - 대상 노드 타입 목록
 * @param {Object} attrsToSet - 설정할 속성 객체
 * @returns {function} TipTap 커맨드 함수
 */
export function applyToSelectedParagraphs(types, attrsToSet) {
  return ({ tr, state, dispatch }) => {
    const { from, to } = state.selection;
    let applied = false;
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (types.includes(node.type.name)) {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrsToSet });
        applied = true;
      }
    });
    if (applied && dispatch) dispatch(tr);
    return true;
  };
}

/**
 * 단락 테두리 및 배경 음영 확장
 * 단락별로 상하좌우 테두리와 배경색을 설정할 수 있다.
 *
 * @example editor.commands.setParagraphBorder({ borderBottom: "1px solid #000" })
 * @example editor.commands.setParagraphShading("#f0f0f0")
 */
export const ParagraphBorder = Extension.create({
  name: "paragraphBorder",

  addOptions() {
    return { types: ["paragraph", "heading"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          borderTop: {
            default: null,
            parseHTML: (el) => el.style.borderTop || null,
            renderHTML: (attrs) => {
              if (!attrs.borderTop) return {};
              return { style: `border-top: ${attrs.borderTop}` };
            },
          },
          borderBottom: {
            default: null,
            parseHTML: (el) => el.style.borderBottom || null,
            renderHTML: (attrs) => {
              if (!attrs.borderBottom) return {};
              return { style: `border-bottom: ${attrs.borderBottom}` };
            },
          },
          borderLeft: {
            default: null,
            parseHTML: (el) => el.style.borderLeft || null,
            renderHTML: (attrs) => {
              if (!attrs.borderLeft) return {};
              return { style: `border-left: ${attrs.borderLeft}` };
            },
          },
          borderRight: {
            default: null,
            parseHTML: (el) => el.style.borderRight || null,
            renderHTML: (attrs) => {
              if (!attrs.borderRight) return {};
              return { style: `border-right: ${attrs.borderRight}` };
            },
          },
          borderColor: {
            default: null,
            parseHTML: (el) => el.style.borderColor || null,
            renderHTML: (attrs) => {
              if (!attrs.borderColor) return {};
              return { style: `border-color: ${attrs.borderColor}` };
            },
          },
          backgroundColor: {
            default: null,
            parseHTML: (el) => el.style.backgroundColor || null,
            renderHTML: (attrs) => {
              if (!attrs.backgroundColor) return {};
              return { style: `background-color: ${attrs.backgroundColor}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      /**
       * 단락 테두리를 설정한다.
       * @param {Object} sides - 테두리 속성 (borderTop, borderBottom, borderLeft, borderRight, borderColor)
       */
      setParagraphBorder:
        (sides) =>
        applyToSelectedParagraphs(this.options.types, sides),

      /**
       * 단락 배경 음영을 설정한다.
       * @param {string} color - CSS 색상 값
       */
      setParagraphShading:
        (color) =>
        applyToSelectedParagraphs(this.options.types, { backgroundColor: color }),

      /** 단락 테두리와 배경을 모두 제거한다 */
      unsetParagraphBorder:
        () =>
        applyToSelectedParagraphs(this.options.types, {
          borderTop: null,
          borderBottom: null,
          borderLeft: null,
          borderRight: null,
          borderColor: null,
          backgroundColor: null,
        }),
    };
  },
});

/**
 * 드롭 캡(첫글자 장식) 확장
 * 단락의 첫 글자를 크게 표시하는 Word의 드롭 캡 기능을 구현한다.
 *
 * @example editor.commands.setDropCap("dropped")
 */
export const DropCap = Extension.create({
  name: "dropCap",

  addOptions() {
    return { types: ["paragraph"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          dropCap: {
            default: "none",
            parseHTML: (el) => el.getAttribute("data-drop-cap") || "none",
            renderHTML: (attrs) => {
              if (!attrs.dropCap || attrs.dropCap === "none") return {};
              return { "data-drop-cap": attrs.dropCap };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      /**
       * 드롭 캡 유형을 설정한다.
       * @param {string} type - "none" | "dropped" | "in-margin"
       */
      setDropCap:
        (type) =>
        applyToSelectedParagraphs(this.options.types, { dropCap: type }),
      unsetDropCap:
        () =>
        applyToSelectedParagraphs(this.options.types, { dropCap: "none" }),
    };
  },
});

/**
 * 다음 단락과 함께 유지 확장
 * 페이지 나눔 시 현재 단락과 다음 단락이 분리되지 않도록 한다.
 * Word의 "다음 단락과 함께" 옵션에 해당한다.
 */
export const KeepWithNext = Extension.create({
  name: "keepWithNext",

  addOptions() {
    return { types: ["paragraph", "heading"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          keepWithNext: {
            default: false,
            parseHTML: (el) => el.getAttribute("data-keep-with-next") === "true",
            renderHTML: (attrs) => {
              if (!attrs.keepWithNext) return {};
              return { "data-keep-with-next": "true" };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      /** @param {boolean} value - 다음 단락과 함께 유지 여부 */
      setKeepWithNext:
        (value) =>
        applyToSelectedParagraphs(this.options.types, { keepWithNext: !!value }),
    };
  },
});

/**
 * 과부/고아 줄 방지 확장
 * 페이지 상단에 단락의 마지막 줄만 남거나(과부),
 * 페이지 하단에 단락의 첫 줄만 남는(고아) 것을 방지한다.
 * Word에서는 기본적으로 활성화되어 있다.
 */
export const WidowOrphan = Extension.create({
  name: "widowOrphan",

  addOptions() {
    return { types: ["paragraph", "heading"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          widowOrphan: {
            default: true,
            parseHTML: (el) => el.getAttribute("data-widow-orphan") !== "false",
            renderHTML: (attrs) => {
              // 기본값(true)이면 속성을 렌더링하지 않는다
              if (attrs.widowOrphan !== false) return {};
              return { "data-widow-orphan": "false" };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      /** @param {boolean} value - 과부/고아 줄 방지 활성화 여부 */
      setWidowOrphan:
        (value) =>
        applyToSelectedParagraphs(this.options.types, { widowOrphan: !!value }),
    };
  },
});

/**
 * 텍스트 방향(RTL/LTR) 확장
 * 단락의 텍스트 방향을 왼쪽→오른쪽 또는 오른쪽→왼쪽으로 설정한다.
 * 아랍어, 히브리어 등 RTL 언어 지원에 사용한다.
 */
export const TextDirection = Extension.create({
  name: "textDirection",

  addOptions() {
    return { types: ["paragraph", "heading"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          direction: {
            default: null,
            parseHTML: (el) => el.getAttribute("dir") || null,
            renderHTML: (attrs) => {
              if (!attrs.direction) return {};
              return { dir: attrs.direction };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      /** @param {string} value - "ltr" 또는 "rtl" */
      setTextDirection:
        (value) =>
        applyToSelectedParagraphs(this.options.types, { direction: value }),
    };
  },
});
