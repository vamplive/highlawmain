/**
 * 유틸리티 확장 모듈
 * NonBreakingSpace, LineNumbers 등
 * 에디터 보조 기능을 제공하는 경량 확장들.
 */
import { Extension } from "@tiptap/core";

/**
 * 줄바꿈 없는 공백을 삽입하는 확장
 * Ctrl+Shift+Space로 삽입할 수 있다.
 */
export const NonBreakingSpace = Extension.create({
  name: "nonBreakingSpace",

  addCommands() {
    return {
      insertNonBreakingSpace:
        () =>
        ({ commands }) =>
          commands.insertContent("\u00A0"),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-Space": () => this.editor.commands.insertNonBreakingSpace(),
    };
  },
});

/**
 * 줄 번호 표시 확장
 * 문서 전체 또는 구역별로 줄 번호를 표시할 수 있다.
 */
export const LineNumbers = Extension.create({
  name: "lineNumbers",

  addStorage() {
    return {
      enabled: false,
      startAt: 1,
      countBy: 1,
      restartEachPage: true,
    };
  },

  addCommands() {
    return {
      toggleLineNumbers:
        () =>
        ({ editor: ed }) => {
          ed.storage.lineNumbers.enabled = !ed.storage.lineNumbers.enabled;
          return true;
        },
      setLineNumberOptions:
        (opts) =>
        ({ editor: ed }) => {
          Object.assign(ed.storage.lineNumbers, opts);
          return true;
        },
    };
  },
});
