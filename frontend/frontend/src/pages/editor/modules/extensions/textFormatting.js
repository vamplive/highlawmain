/**
 * 텍스트 서식 확장 모듈
 * FontSize, LineSpacing, Indent, ParagraphSpacing 등
 * textStyle 마크 기반의 텍스트 서식 속성을 정의한다.
 */
import { Extension } from "@tiptap/core";

/* ── FontSize Extension ── */
export const FontSize = Extension.create({
  name: "fontSize",

  addOptions() {
    return { types: ["textStyle"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => el.style.fontSize?.replace(/['"]+/g, "") || null,
            renderHTML: (attrs) => {
              if (!attrs.fontSize) return {};
              return { style: `font-size: ${attrs.fontSize}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

/* ── LineSpacing Extension ── */
export const LineSpacing = Extension.create({
  name: "lineSpacing",

  addOptions() {
    return { types: ["paragraph", "heading"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineSpacing: {
            default: null,
            parseHTML: (el) => el.style.lineHeight || null,
            renderHTML: (attrs) => {
              if (!attrs.lineSpacing) return {};
              return { style: `line-height: ${attrs.lineSpacing}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineSpacing:
        (spacing) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;
          let applied = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, lineSpacing: spacing });
              applied = true;
            }
          });
          if (applied && dispatch) dispatch(tr);
          return true;
        },
      unsetLineSpacing:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;
          let applied = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const newAttrs = { ...node.attrs };
              delete newAttrs.lineSpacing;
              tr.setNodeMarkup(pos, undefined, newAttrs);
              applied = true;
            }
          });
          if (applied && dispatch) dispatch(tr);
          return true;
        },
    };
  },
});

/* ── Indent Extension ── */
export const Indent = Extension.create({
  name: "indent",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
      minLevel: 0,
      maxLevel: 10,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (el) => {
              const ml = el.style.marginLeft;
              if (!ml) return 0;
              return Math.round(parseInt(ml) / 40) || 0;
            },
            renderHTML: (attrs) => {
              if (!attrs.indent || attrs.indent <= 0) return {};
              return { style: `margin-left: ${attrs.indent * 40}px` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      increaseIndent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;
          let changed = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent < this.options.maxLevel) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: currentIndent + 1,
                });
                changed = true;
              }
            }
          });
          if (changed && dispatch) dispatch(tr);
          return changed;
        },
      decreaseIndent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;
          let changed = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent > this.options.minLevel) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: currentIndent - 1,
                });
                changed = true;
              }
            }
          });
          if (changed && dispatch) dispatch(tr);
          return changed;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.increaseIndent(),
      "Shift-Tab": () => this.editor.commands.decreaseIndent(),
    };
  },
});

/* ── ParagraphSpacing Extension ── */
export const ParagraphSpacing = Extension.create({
  name: "paragraphSpacing",

  addOptions() {
    return { types: ["paragraph", "heading"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          spacingBefore: {
            default: null,
            parseHTML: (el) => el.style.marginTop || null,
            renderHTML: (attrs) => {
              if (!attrs.spacingBefore) return {};
              return { style: `margin-top: ${attrs.spacingBefore}` };
            },
          },
          spacingAfter: {
            default: null,
            parseHTML: (el) => el.style.marginBottom || null,
            renderHTML: (attrs) => {
              if (!attrs.spacingAfter) return {};
              return { style: `margin-bottom: ${attrs.spacingAfter}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setSpacingBefore:
        (value) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;
          let applied = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, spacingBefore: value });
              applied = true;
            }
          });
          if (applied && dispatch) dispatch(tr);
          return true;
        },
      setSpacingAfter:
        (value) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;
          let applied = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, spacingAfter: value });
              applied = true;
            }
          });
          if (applied && dispatch) dispatch(tr);
          return true;
        },
    };
  },
});

/**
 * 자간(글자 간격) 확장
 * textStyle 마크에 letterSpacing 속성을 추가한다.
 *
 * @example editor.commands.setLetterSpacing("1px")
 */
export const LetterSpacing = Extension.create({
  name: "letterSpacing",

  addOptions() {
    return { types: ["textStyle"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          letterSpacing: {
            default: null,
            parseHTML: (el) => el.style.letterSpacing || null,
            renderHTML: (attrs) => {
              if (!attrs.letterSpacing) return {};
              return { style: `letter-spacing: ${attrs.letterSpacing}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      /** @param {string} value - CSS 자간 값 (예: "0.5px", "1px", "-0.5px") */
      setLetterSpacing:
        (value) =>
        ({ chain }) =>
          chain().setMark("textStyle", { letterSpacing: value }).run(),
      unsetLetterSpacing:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { letterSpacing: null }).removeEmptyTextStyle().run(),
    };
  },
});

/**
 * 텍스트 그림자 확장
 * textStyle 마크에 textShadow 속성을 추가한다.
 *
 * @example editor.commands.setTextShadow("2px 2px 4px rgba(0,0,0,0.3)")
 */
export const TextShadow = Extension.create({
  name: "textShadow",

  addOptions() {
    return { types: ["textStyle"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textShadow: {
            default: null,
            parseHTML: (el) => el.style.textShadow || null,
            renderHTML: (attrs) => {
              if (!attrs.textShadow) return {};
              return { style: `text-shadow: ${attrs.textShadow}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      /** @param {string} value - CSS text-shadow 값 */
      setTextShadow:
        (value) =>
        ({ chain }) =>
          chain().setMark("textStyle", { textShadow: value }).run(),
      unsetTextShadow:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { textShadow: null }).removeEmptyTextStyle().run(),
    };
  },
});

/**
 * 텍스트 테두리 확장
 * textStyle 마크에 테두리(border) 속성을 추가한다.
 *
 * @example editor.commands.setTextBorder("1px solid #000")
 */
export const TextBorder = Extension.create({
  name: "textBorder",

  addOptions() {
    return { types: ["textStyle"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textBorder: {
            default: null,
            parseHTML: (el) => el.style.border || null,
            renderHTML: (attrs) => {
              if (!attrs.textBorder) return {};
              return { style: `border: ${attrs.textBorder}; padding: 1px 2px` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      /** @param {string} value - CSS border 값 (예: "1px solid #000") */
      setTextBorder:
        (value) =>
        ({ chain }) =>
          chain().setMark("textStyle", { textBorder: value }).run(),
      unsetTextBorder:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { textBorder: null }).removeEmptyTextStyle().run(),
    };
  },
});
