/**
 * ReferencesTab.jsx — 에디터 리본 "참조" 탭
 * 목차 생성, 각주/미주 삽입 및 탐색, 인용 표식을 제공한다.
 */

import { memo } from "react";
import { ListTree, Footprints, BookOpen } from "lucide-react";
import { RibbonBtn, RibbonBtnLarge, GroupSep, RibbonGroup, DropdownButton } from "./RibbonParts";
import { showEditorAlert } from "./editorToast";

const ICON_SIZE = 12;

export const ReferencesTab = memo(function ReferencesTab({ editor, onInsertFootnote, onInsertEndnote, onOpenFootnoteDialog }) {
  if (!editor) return null;

  /** 문서 내 제목(h1~h4)을 수집하여 목차 HTML을 생성하고 문서 앞에 삽입한다. */
  const insertTOC = () => {
    const html = editor.getHTML();
    const hReg = /<h([1-4])[^>]*>(.*?)<\/h[1-4]>/gi;
    const heads = [];
    let m;
    while ((m = hReg.exec(html))) {
      heads.push({ level: parseInt(m[1]), text: m[2].replace(/<[^>]+>/g, "") });
    }
    if (!heads.length) {
      showEditorAlert("제목이 없습니다.");
      return;
    }
    let toc = '<div style="border:1px solid #e2e8f0;padding:16px;margin:12px 0;background:#fafafa;border-radius:4px;">';
    toc += '<p style="font-weight:700;font-size:13pt;margin-bottom:8px;">목차</p>';
    for (const h of heads) {
      toc += `<p style="margin:2px 0;padding-left:${(h.level - 1) * 20}px;font-size:${13 - h.level}pt;">${h.text}</p>`;
    }
    toc += "</div>";
    editor.commands.setContent(toc + html);
  };

  /** 각주/미주 탐색 핸들러를 생성한다. */
  const navigateNote = (direction, noteType) => (e) => {
    e.preventDefault();
    const { from } = editor.state.selection;
    let targetPos = null;

    editor.state.doc.descendants((node, pos) => {
      const isTarget = node.type.name === "footnoteReference"
        && (!noteType || node.attrs.noteType === noteType);

      if (direction === "next" && isTarget && pos > from && targetPos === null) {
        targetPos = pos;
        return false;
      }
      if (direction === "prev" && isTarget && pos < from) {
        targetPos = pos;
      }
    });

    if (targetPos !== null) {
      editor.chain().focus().setTextSelection(targetPos).scrollIntoView().run();
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "stretch", background: "var(--ribbon-bg, #fff)", borderBottom: "1px solid var(--ribbon-sep, #d1d5db)", flexShrink: 0, minHeight: 84, padding: "0 2px" }}>
      <RibbonGroup label="목차">
        <RibbonBtnLarge icon={<ListTree size={18} />} label="목차 생성" onClick={insertTOC} title="목차 생성" />
      </RibbonGroup>
      <GroupSep />
      <RibbonGroup label="각주" dialogLauncher={onOpenFootnoteDialog}>
        <div style={{ display: "flex", gap: 4 }}>
          <RibbonBtnLarge
            icon={<span style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>A<sup style={{ fontSize: 10, color: "#0563C1" }}>1</sup></span>}
            label="각주 삽입"
            onClick={() => onInsertFootnote?.()}
            title="각주 삽입 (Alt+Ctrl+F)" />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <RibbonBtn onClick={() => onInsertEndnote?.()} title="미주 삽입 (Alt+Ctrl+D)" small>
              <Footprints size={ICON_SIZE} /> <span style={{ fontSize: 10 }}>미주 삽입</span>
            </RibbonBtn>
            <DropdownButton trigger={
              <RibbonBtn title="다음 각주로 이동" small>
                <span style={{ fontSize: 10 }}>다음 각주 ▼</span>
              </RibbonBtn>
            }>
              <button className="word-dropdown-item" onMouseDown={navigateNote("next", null)}>다음 각주</button>
              <button className="word-dropdown-item" onMouseDown={navigateNote("prev", null)}>이전 각주</button>
              <div className="word-dropdown-sep" />
              <button className="word-dropdown-item" onMouseDown={navigateNote("next", "endnote")}>다음 미주</button>
              <button className="word-dropdown-item" onMouseDown={navigateNote("prev", "endnote")}>이전 미주</button>
            </DropdownButton>
            <RibbonBtn onClick={onOpenFootnoteDialog} title="각주/미주 설정" small>
              <span style={{ fontSize: 10 }}>각주/미주...</span>
            </RibbonBtn>
          </div>
        </div>
      </RibbonGroup>
      <GroupSep />
      <RibbonGroup label="인용">
        <RibbonBtn onClick={() => {
          const t = window.prompt("인용:");
          if (t) {
            const safe = t.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
            editor.chain().focus().insertContent(`<span style="font-size:9pt;color:#3b82f6;">[${safe}]</span>`).run();
          }
        }} title="인용 표식 삽입" small>
          <BookOpen size={ICON_SIZE} /> <span style={{ fontSize: 10 }}>인용</span>
        </RibbonBtn>
      </RibbonGroup>
    </div>
  );
});
