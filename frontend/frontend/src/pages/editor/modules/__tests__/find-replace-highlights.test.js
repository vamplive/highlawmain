import { describe, expect, it } from "vitest";
import { Schema } from "@tiptap/pm/model";
import { buildFindHighlightDecorations } from "../findReplaceHighlights";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: {
      content: "inline*",
      group: "block",
      toDOM: () => ["p", 0],
      parseDOM: [{ tag: "p" }],
    },
    text: { group: "inline" },
  },
});

function createDoc(text) {
  return schema.node("doc", null, [
    schema.node("paragraph", null, [schema.text(text)]),
  ]);
}

describe("buildFindHighlightDecorations", () => {
  it("모든 매치와 활성 매치를 inline decoration으로 만든다", () => {
    const doc = createDoc("alpha beta alpha");
    const decorations = buildFindHighlightDecorations(doc, [
      { from: 1, to: 6 },
      { from: 12, to: 17 },
    ], 1).find();

    expect(decorations).toHaveLength(2);
    expect(decorations[0].from).toBe(1);
    expect(decorations[0].to).toBe(6);
    expect(decorations[0].type.attrs.class).toBe("find-highlight");
    expect(decorations[0].type.attrs["data-find-highlight"]).toBe("match");

    expect(decorations[1].from).toBe(12);
    expect(decorations[1].to).toBe(17);
    expect(decorations[1].type.attrs.class).toContain("find-highlight-active");
    expect(decorations[1].type.attrs["data-find-highlight"]).toBe("active");
  });

  it("문서 범위를 벗어나거나 비어 있는 매치는 버린다", () => {
    const doc = createDoc("short");
    const decorations = buildFindHighlightDecorations(doc, [
      { from: 1, to: 1 },
      { from: -1, to: 3 },
      { from: 1, to: 100 },
      { from: 1, to: 6 },
    ], 0).find();

    expect(decorations).toHaveLength(1);
    expect(decorations[0].from).toBe(1);
    expect(decorations[0].to).toBe(6);
  });
});
