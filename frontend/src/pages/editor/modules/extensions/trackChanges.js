/**
 * 변경 내용 추적 확장 모듈
 * TrackInsert, TrackDelete, TrackFormat 마크와
 * TrackChangesManager 확장을 정의한다.
 * Word의 "변경 내용 추적" 기능에 해당한다.
 */
import { Extension, Mark } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

/**
 * 삽입 추적 마크 - 추가된 텍스트를 표시한다
 * Word의 "변경 내용 추적" 기능 중 삽입에 해당한다.
 */
export const TrackInsert = Mark.create({
  name: "trackInsert",
  inclusive: true,
  excludes: "trackDelete",

  addAttributes() {
    return {
      author: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-author"),
        renderHTML: (attrs) => ({ "data-author": attrs.author }),
      },
      date: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-date"),
        renderHTML: (attrs) => ({ "data-date": attrs.date }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-track="insert"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", {
      ...HTMLAttributes,
      "data-track": "insert",
      class: "track-insert",
    }, 0];
  },

  addCommands() {
    return {
      setTrackInsert:
        (attrs) =>
        ({ commands }) =>
          commands.setMark(this.name, {
            author: attrs?.author || "사용자",
            date: attrs?.date || new Date().toISOString(),
          }),
      unsetTrackInsert:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});

/**
 * 삭제 추적 마크 - 삭제된 텍스트를 표시한다
 * Word의 "변경 내용 추적" 기능 중 삭제에 해당한다.
 */
export const TrackDelete = Mark.create({
  name: "trackDelete",
  inclusive: false,
  excludes: "trackInsert",

  addAttributes() {
    return {
      author: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-author"),
        renderHTML: (attrs) => ({ "data-author": attrs.author }),
      },
      date: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-date"),
        renderHTML: (attrs) => ({ "data-date": attrs.date }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-track="delete"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", {
      ...HTMLAttributes,
      "data-track": "delete",
      class: "track-delete",
    }, 0];
  },

  addCommands() {
    return {
      setTrackDelete:
        (attrs) =>
        ({ commands }) =>
          commands.setMark(this.name, {
            author: attrs?.author || "사용자",
            date: attrs?.date || new Date().toISOString(),
          }),
      unsetTrackDelete:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});

/**
 * 서식 변경 추적 마크 - 서식이 변경된 텍스트를 표시한다
 */
export const TrackFormat = Mark.create({
  name: "trackFormat",
  inclusive: false,

  addAttributes() {
    return {
      author: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-author"),
        renderHTML: (attrs) => ({ "data-author": attrs.author }),
      },
      date: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-date"),
        renderHTML: (attrs) => ({ "data-date": attrs.date }),
      },
      description: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-description"),
        renderHTML: (attrs) => ({ "data-description": attrs.description }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-track="format"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", {
      ...HTMLAttributes,
      "data-track": "format",
      class: "track-format",
    }, 0];
  },

  addCommands() {
    return {
      setTrackFormat:
        (attrs) =>
        ({ commands }) =>
          commands.setMark(this.name, {
            author: attrs?.author || "사용자",
            date: attrs?.date || new Date().toISOString(),
            description: attrs?.description || "",
          }),
      unsetTrackFormat:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});

/**
 * 변경 내용 추적 관리 확장
 * 추적 모드를 활성/비활성화하고, 변경 사항을 수락/거부하는 기능을 제공한다.
 */
const trackChangesPluginKey = new PluginKey("trackChanges");

function collectTrackChangeRanges(doc) {
  const ranges = [];
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const hasTrackMark = node.marks.some((mark) =>
      mark.type.name === "trackInsert" ||
      mark.type.name === "trackDelete" ||
      mark.type.name === "trackFormat"
    );
    if (hasTrackMark) ranges.push({ from: pos, to: pos + node.nodeSize });
  });
  return ranges;
}

export const TrackChangesManager = Extension.create({
  name: "trackChangesManager",

  addStorage() {
    return {
      enabled: false,
      author: "사용자",
    };
  },

  /* 입력 시 자동으로 삽입 추적 마크를 적용하는 ProseMirror 플러그인 */
  addProseMirrorPlugins() {
    const extension = this;
    return [
      new Plugin({
        key: trackChangesPluginKey,
        appendTransaction(transactions, oldState, newState) {
          if (!extension.storage.enabled) return null;
          const author = extension.storage.author;
          const date = new Date().toISOString();

          // 사용자 입력에 의한 변경인지 확인
          const isUserAction = transactions.some(tr => tr.docChanged && !tr.getMeta("trackChangesApplied"));
          if (!isUserAction) return null;

          // 새로 삽입된 텍스트에 trackInsert 마크를 적용
          const tr = newState.tr;
          let changed = false;
          const insertMarkType = newState.schema.marks.trackInsert;
          if (!insertMarkType) return null;

          transactions.forEach(transaction => {
            if (!transaction.docChanged) return;
            transaction.steps.forEach((step) => {
              const stepMap = step.getMap();
              stepMap.forEach((oldStart, oldEnd, newStart, newEnd) => {
                // 새로 삽입된 범위에만 마크 적용
                if (newEnd > newStart) {
                  const mark = insertMarkType.create({ author, date });
                  // 이미 trackInsert 마크가 있는지 확인
                  let needsMark = false;
                  newState.doc.nodesBetween(newStart, newEnd, (node) => {
                    if (node.isText && !node.marks.some(m => m.type.name === "trackInsert")) {
                      needsMark = true;
                    }
                  });
                  if (needsMark) {
                    tr.addMark(newStart, newEnd, mark);
                    changed = true;
                  }
                }
              });
            });
          });

          if (changed) {
            tr.setMeta("trackChangesApplied", true);
            return tr;
          }
          return null;
        },
      }),
    ];
  },

  addCommands() {
    return {
      /** 변경 추적 모드를 켜거나 끈다 */
      toggleTrackChanges:
        () =>
        ({ editor: ed }) => {
          ed.storage.trackChangesManager.enabled = !ed.storage.trackChangesManager.enabled;
          return true;
        },

      /** 변경 추적 활성 여부 확인 */
      isTrackChangesEnabled:
        () =>
        ({ editor: ed }) =>
          ed.storage.trackChangesManager.enabled,

      /** 추적 작성자를 설정한다 */
      setTrackAuthor:
        (author) =>
        ({ editor: ed }) => {
          ed.storage.trackChangesManager.author = author;
          return true;
        },

      /** 현재 선택 영역의 변경 사항을 수락한다 */
      acceptChange:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!node.isText) return;
            const marks = node.marks;

            // 삽입 추적 마크가 있으면 마크만 제거 (텍스트는 유지)
            const insertMark = marks.find(m => m.type.name === "trackInsert");
            if (insertMark) {
              tr.removeMark(pos, pos + node.nodeSize, insertMark.type);
              changed = true;
            }

            // 삭제 추적 마크가 있으면 텍스트와 마크 모두 제거
            const deleteMark = marks.find(m => m.type.name === "trackDelete");
            if (deleteMark) {
              tr.delete(pos, pos + node.nodeSize);
              changed = true;
            }

            // 서식 추적 마크가 있으면 마크만 제거
            const formatMark = marks.find(m => m.type.name === "trackFormat");
            if (formatMark) {
              tr.removeMark(pos, pos + node.nodeSize, formatMark.type);
              changed = true;
            }
          });

          if (changed && dispatch) dispatch(tr);
          return changed;
        },

      /** 현재 커서 기준 다음 변경 사항으로 이동한다 */
      goToNextChange:
        () =>
        ({ state, commands }) => {
          const ranges = collectTrackChangeRanges(state.doc);
          if (!ranges.length) return false;

          const { to } = state.selection;
          const target = ranges.find((range) => range.from > to) || ranges[0];
          return commands.setTextSelection({ from: target.from, to: target.to })
            && commands.scrollIntoView();
        },

      /** 현재 커서 기준 이전 변경 사항으로 이동한다 */
      goToPreviousChange:
        () =>
        ({ state, commands }) => {
          const ranges = collectTrackChangeRanges(state.doc);
          if (!ranges.length) return false;

          const { from } = state.selection;
          const target = [...ranges].reverse().find((range) => range.to < from) || ranges[ranges.length - 1];
          return commands.setTextSelection({ from: target.from, to: target.to })
            && commands.scrollIntoView();
        },

      /** 현재 선택 영역의 변경 사항을 거부한다 */
      rejectChange:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!node.isText) return;
            const marks = node.marks;

            // 삽입 추적 마크가 있으면 텍스트와 마크 모두 제거 (삽입을 되돌림)
            const insertMark = marks.find(m => m.type.name === "trackInsert");
            if (insertMark) {
              tr.delete(pos, pos + node.nodeSize);
              changed = true;
            }

            // 삭제 추적 마크가 있으면 마크만 제거 (텍스트 복원)
            const deleteMark = marks.find(m => m.type.name === "trackDelete");
            if (deleteMark) {
              tr.removeMark(pos, pos + node.nodeSize, deleteMark.type);
              changed = true;
            }

            // 서식 추적 마크가 있으면 마크만 제거
            const formatMark = marks.find(m => m.type.name === "trackFormat");
            if (formatMark) {
              tr.removeMark(pos, pos + node.nodeSize, formatMark.type);
              changed = true;
            }
          });

          if (changed && dispatch) dispatch(tr);
          return changed;
        },

      /** 문서의 모든 변경 사항을 수락한다 */
      acceptAllChanges:
        () =>
        ({ tr, state, dispatch }) => {
          let changed = false;
          const doc = state.doc;

          // 역순으로 처리하여 위치 오프셋 문제 방지
          const deletions = [];
          const removals = [];

          doc.descendants((node, pos) => {
            if (!node.isText) return;
            const marks = node.marks;
            const insertMark = marks.find(m => m.type.name === "trackInsert");
            if (insertMark) {
              removals.push({ from: pos, to: pos + node.nodeSize, type: insertMark.type });
            }
            const deleteMark = marks.find(m => m.type.name === "trackDelete");
            if (deleteMark) {
              deletions.push({ from: pos, to: pos + node.nodeSize });
            }
            const formatMark = marks.find(m => m.type.name === "trackFormat");
            if (formatMark) {
              removals.push({ from: pos, to: pos + node.nodeSize, type: formatMark.type });
            }
          });

          // 역순으로 삭제 (위치 안정성)
          deletions.sort((a, b) => b.from - a.from);
          for (const del of deletions) {
            tr.delete(del.from, del.to);
            changed = true;
          }
          for (const rem of removals) {
            tr.removeMark(rem.from, rem.to, rem.type);
            changed = true;
          }

          if (changed && dispatch) dispatch(tr);
          return changed;
        },

      /** 문서의 모든 변경 사항을 거부한다 */
      rejectAllChanges:
        () =>
        ({ tr, state, dispatch }) => {
          let changed = false;
          const doc = state.doc;
          const insertions = [];
          const removals = [];

          doc.descendants((node, pos) => {
            if (!node.isText) return;
            const marks = node.marks;
            const insertMark = marks.find(m => m.type.name === "trackInsert");
            if (insertMark) {
              insertions.push({ from: pos, to: pos + node.nodeSize });
            }
            const deleteMark = marks.find(m => m.type.name === "trackDelete");
            if (deleteMark) {
              removals.push({ from: pos, to: pos + node.nodeSize, type: deleteMark.type });
            }
            const formatMark = marks.find(m => m.type.name === "trackFormat");
            if (formatMark) {
              removals.push({ from: pos, to: pos + node.nodeSize, type: formatMark.type });
            }
          });

          insertions.sort((a, b) => b.from - a.from);
          for (const ins of insertions) {
            tr.delete(ins.from, ins.to);
            changed = true;
          }
          for (const rem of removals) {
            tr.removeMark(rem.from, rem.to, rem.type);
            changed = true;
          }

          if (changed && dispatch) dispatch(tr);
          return changed;
        },
    };
  },
});
