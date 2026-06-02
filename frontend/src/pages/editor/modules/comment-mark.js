/**
 * CommentMark - ProseMirror Mark for comment highlights
 * Marks text ranges that have comments attached.
 */
import { Mark, mergeAttributes } from "@tiptap/core";

export const CommentMark = Mark.create({
  name: "comment",

  // Allow multiple comment marks to overlap
  excludes: "",

  // Don't extend the mark when typing at the edges
  inclusive: false,

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-comment-id"),
        renderHTML: (attrs) => {
          if (!attrs.commentId) return {};
          return { "data-comment-id": attrs.commentId };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-comment-id]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        class: "comment-highlight",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setComment:
        (commentId) =>
        ({ commands, state }) => {
          const { from, to } = state.selection;
          if (from === to) return false;
          return commands.setMark(this.name, { commentId });
        },

      unsetComment:
        (commentId) =>
        ({ tr, state, dispatch }) => {
          if (!dispatch) return true;
          const { doc } = state;
          doc.descendants((node, pos) => {
            if (!node.isText) return;
            const marks = node.marks.filter(
              (m) => m.type.name === "comment" && m.attrs.commentId === commentId
            );
            marks.forEach((mark) => {
              tr.removeMark(pos, pos + node.nodeSize, mark);
            });
          });
          dispatch(tr);
          return true;
        },

      unsetAllComments:
        () =>
        ({ tr, state, dispatch }) => {
          if (!dispatch) return true;
          const { doc } = state;
          const markType = state.schema.marks.comment;
          if (!markType) return false;
          tr.removeMark(0, doc.content.size, markType);
          dispatch(tr);
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Alt-m": () => {
        // This triggers comment insertion — handled by the store via event
        const event = new CustomEvent("comment:insert");
        window.dispatchEvent(event);
        return true;
      },
    };
  },
});
