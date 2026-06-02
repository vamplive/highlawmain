import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const HIGHLIGHT_CLASSES = {
  normal: "find-highlight",
  active: "find-highlight-active",
};

const FIND_HIGHLIGHT_STYLE = "background: rgba(255, 224, 102, 0.8); border-radius: 2px; box-shadow: inset 0 -1px 0 rgba(172, 132, 0, 0.55);";
const ACTIVE_FIND_HIGHLIGHT_STYLE = "background: rgba(24, 90, 189, 0.28); border-radius: 2px; box-shadow: inset 0 0 0 1px #185ABD;";

export const findReplaceHighlightKey = new PluginKey("findReplaceHighlights");

function normalizeMatches(doc, matchList = []) {
  const docSize = doc?.content?.size ?? 0;
  return matchList
    .map((match, idx) => ({
      from: Number(match?.from),
      to: Number(match?.to),
      idx,
    }))
    .filter(({ from, to }) => (
      Number.isFinite(from)
      && Number.isFinite(to)
      && from >= 0
      && to > from
      && to <= docSize
    ));
}

export function buildFindHighlightDecorations(doc, matchList = [], activeIdx = -1) {
  const decorations = normalizeMatches(doc, matchList).map((match) => {
    const isActive = match.idx === activeIdx;
    return Decoration.inline(match.from, match.to, {
      class: isActive
        ? `${HIGHLIGHT_CLASSES.normal} ${HIGHLIGHT_CLASSES.active}`
        : HIGHLIGHT_CLASSES.normal,
      style: isActive ? ACTIVE_FIND_HIGHLIGHT_STYLE : FIND_HIGHLIGHT_STYLE,
      "data-find-highlight": isActive ? "active" : "match",
    });
  });

  return DecorationSet.create(doc, decorations);
}

export function createFindReplaceHighlightPlugin() {
  return new Plugin({
    key: findReplaceHighlightKey,
    state: {
      init() {
        return DecorationSet.empty;
      },
      apply(tr, previousDecorationSet, _oldState, newState) {
        const meta = tr.getMeta(findReplaceHighlightKey);
        if (meta) {
          return buildFindHighlightDecorations(
            newState.doc,
            meta.matches || [],
            Number.isInteger(meta.activeIdx) ? meta.activeIdx : -1,
          );
        }
        return previousDecorationSet.map(tr.mapping, tr.doc);
      },
    },
    props: {
      decorations(state) {
        return findReplaceHighlightKey.getState(state);
      },
    },
  });
}
