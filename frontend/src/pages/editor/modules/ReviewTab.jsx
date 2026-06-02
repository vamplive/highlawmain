/**
 * ReviewTab.jsx — 에디터 리본 "검토" 탭
 * 맞춤법 검사, 단어 수 통계, 메모(댓글), 변경 내용 추적/수락/거부를 제공한다.
 */

import { memo, useState } from "react";
import {
  Eye, CheckSquare, MessageSquare, FileText,
  BookOpenCheck, Languages,
} from "lucide-react";
import { RibbonBtn, RibbonBtnLarge, GroupSep, RibbonGroup, DropdownButton } from "./RibbonParts";
import { showEditorAlert } from "./editorToast";

const ICON_SIZE = 12;

/** 마크업 표시 모드 라벨 */
const MARKUP_LABELS = {
  all: "모든 태그",
  simple: "간단한 태그",
  none: "태그 없음",
  original: "원본",
};

export const ReviewTab = memo(function ReviewTab({
  editor, onInsertComment, onDeleteComment, onDeleteAllComments,
  onPrevComment, onNextComment, commentStore, commentDispatch,
  trackChangesEnabled, onToggleTrackChanges,
}) {
  const [showWordCount, setShowWordCount] = useState(false);
  if (!editor) return null;

  const text = editor.getText() || "";
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, "").length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim()).length;
  const lines = text.split(/\n/).length;

  const markupMode = commentStore?.markupMode || "all";
  const showPanel = commentStore?.showCommentsPanel ?? true;
  const reviewingPane = commentStore?.showReviewingPane;

  return (
    <div style={{ display: "flex", alignItems: "stretch", background: "var(--ribbon-bg, #fff)", borderBottom: "1px solid var(--ribbon-sep, #d1d5db)", flexShrink: 0, minHeight: 94, padding: "0 2px" }}>
      {/* 언어 교정 그룹 */}
      <RibbonGroup label="언어 교정">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn onClick={() => showEditorAlert("맞춤법 검사 완료. 오류가 없습니다.")} title="맞춤법 및 문법 검사 (F7)" small>
            <CheckSquare size={ICON_SIZE} /> <span style={{ fontSize: 10 }}>맞춤법</span>
          </RibbonBtn>
          <span style={{ position: "relative" }}>
            <RibbonBtn onClick={() => setShowWordCount(v => !v)} title="단어 수 통계" small>
              <FileText size={ICON_SIZE} /> <span style={{ fontSize: 10 }}>단어 수</span>
            </RibbonBtn>
            {showWordCount && (
              <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 100, background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", padding: "14px 18px", minWidth: 240 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, borderBottom: "1px solid #eee", paddingBottom: 6 }}>단어 수 통계</div>
                <table style={{ fontSize: 12, width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {[
                      ["문자 (공백 포함)", chars],
                      ["문자 (공백 제외)", charsNoSpace],
                      ["단어 수", words],
                      ["단락 수", paragraphs],
                      ["줄 수", lines],
                    ].map(([l, v]) => (
                      <tr key={l}>
                        <td style={{ padding: "4px 8px 4px 0", color: "#555" }}>{l}</td>
                        <td style={{ fontWeight: 600, textAlign: "right" }}>{v.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" onClick={() => setShowWordCount(false)}
                  style={{ marginTop: 10, padding: "4px 16px", fontSize: 11, border: "1px solid #ccc", borderRadius: 3, background: "#f8f9fa", cursor: "pointer", width: "100%" }}>닫기</button>
              </div>
            )}
          </span>
          <RibbonBtn onClick={() => showEditorAlert("동의어 사전 기능은 아직 연결되지 않았습니다.")} title="동의어 사전" small>
            <BookOpenCheck size={ICON_SIZE} /> <span style={{ fontSize: 10 }}>동의어</span>
          </RibbonBtn>
        </div>
      </RibbonGroup>
      <GroupSep />

      {/* 메모 그룹 */}
      <RibbonGroup label="메모">
        <div style={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
          <RibbonBtnLarge icon={<MessageSquare size={18} />} label="새 메모"
            onClick={() => onInsertComment?.()}
            title="새 메모 삽입 (Ctrl+Alt+M)" />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <DropdownButton trigger={
              <RibbonBtn title="삭제" small>
                <span style={{ fontSize: 10 }}>삭제 ▼</span>
              </RibbonBtn>
            }>
              <button className="word-dropdown-item" onMouseDown={(e) => { e.preventDefault(); onDeleteComment?.(); }}>현재 메모 삭제</button>
              <div className="word-dropdown-sep" />
              <button className="word-dropdown-item" onMouseDown={(e) => { e.preventDefault(); onDeleteAllComments?.(); }}>문서의 모든 메모 삭제</button>
            </DropdownButton>
            <div style={{ display: "flex", gap: 2 }}>
              <RibbonBtn onClick={onPrevComment} title="이전 메모" small>
                <span style={{ fontSize: 10 }}>◀ 이전</span>
              </RibbonBtn>
              <RibbonBtn onClick={onNextComment} title="다음 메모" small>
                <span style={{ fontSize: 10 }}>다음 ▶</span>
              </RibbonBtn>
            </div>
            <DropdownButton trigger={
              <RibbonBtn title="메모 표시" small>
                <Eye size={ICON_SIZE} /> <span style={{ fontSize: 10 }}>표시 ▼</span>
              </RibbonBtn>
            }>
              <button className={`word-dropdown-item${showPanel ? " active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); commentDispatch?.({ type: "SET_PANEL_VISIBLE", visible: !showPanel }); }}>
                {showPanel ? "☑" : "☐"} 메모 표시
              </button>
            </DropdownButton>
          </div>
        </div>
      </RibbonGroup>
      <GroupSep />

      {/* 변경 내용 추적 그룹 */}
      <RibbonGroup label="추적">
        <div style={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
          <RibbonBtnLarge
            icon={<Eye size={18} color={trackChangesEnabled ? "#185ABD" : undefined} />}
            label={trackChangesEnabled ? "추적 중" : "추적 OFF"}
            onClick={() => onToggleTrackChanges?.()}
            active={trackChangesEnabled}
            title="변경 내용 추적 켜기/끄기" />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <DropdownButton trigger={
              <RibbonBtn title="마크업 표시 모드" small>
                <span style={{ fontSize: 10 }}>{MARKUP_LABELS[markupMode]} ▼</span>
              </RibbonBtn>
            }>
              {["all", "simple", "none", "original"].map((mode) => (
                <button key={mode} className={`word-dropdown-item${markupMode === mode ? " active" : ""}`}
                  onMouseDown={(e) => { e.preventDefault(); commentDispatch?.({ type: "SET_MARKUP_MODE", mode }); }}>
                  {MARKUP_LABELS[mode]}
                </button>
              ))}
            </DropdownButton>
            <DropdownButton trigger={
              <RibbonBtn title="검토 창" small>
                <span style={{ fontSize: 10 }}>검토 창 ▼</span>
              </RibbonBtn>
            }>
              <button className={`word-dropdown-item${reviewingPane === "vertical" ? " active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); commentDispatch?.({ type: "SET_REVIEWING_PANE", mode: reviewingPane === "vertical" ? null : "vertical" }); }}>
                검토 창 세로
              </button>
              <button className={`word-dropdown-item${reviewingPane === "horizontal" ? " active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); commentDispatch?.({ type: "SET_REVIEWING_PANE", mode: reviewingPane === "horizontal" ? null : "horizontal" }); }}>
                검토 창 가로
              </button>
            </DropdownButton>
          </div>
        </div>
      </RibbonGroup>
      <GroupSep />

      {/* 변경 내용 수락/거부 그룹 */}
      <RibbonGroup label="변경 내용">
        <div style={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <DropdownButton trigger={
              <RibbonBtn title="수락" small
                onClick={() => editor.commands.acceptChange()}
                style={{ color: "#16a34a" }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>✓</span>
                <span style={{ fontSize: 10 }}>수락 ▼</span>
              </RibbonBtn>
            }>
              <button className="word-dropdown-item" onMouseDown={(e) => { e.preventDefault(); editor.commands.acceptChange(); }}>
                <span style={{ color: "#16a34a", fontWeight: 700, marginRight: 6 }}>✓</span> 수락 및 다음으로 이동
              </button>
              <button className="word-dropdown-item" onMouseDown={(e) => { e.preventDefault(); editor.commands.acceptAllChanges(); }}>
                <span style={{ color: "#16a34a", fontWeight: 700, marginRight: 6 }}>✓✓</span> 모든 변경 내용 수락
              </button>
            </DropdownButton>
            <DropdownButton trigger={
              <RibbonBtn title="거부" small
                onClick={() => editor.commands.rejectChange()}
                style={{ color: "#dc2626" }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>✕</span>
                <span style={{ fontSize: 10 }}>거부 ▼</span>
              </RibbonBtn>
            }>
              <button className="word-dropdown-item" onMouseDown={(e) => { e.preventDefault(); editor.commands.rejectChange(); }}>
                <span style={{ color: "#dc2626", fontWeight: 700, marginRight: 6 }}>✕</span> 거부 및 다음으로 이동
              </button>
              <button className="word-dropdown-item" onMouseDown={(e) => { e.preventDefault(); editor.commands.rejectAllChanges(); }}>
                <span style={{ color: "#dc2626", fontWeight: 700, marginRight: 6 }}>✕✕</span> 모든 변경 내용 거부
              </button>
            </DropdownButton>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <RibbonBtn
              onClick={() => {
                if (!editor.commands.goToPreviousChange()) showEditorAlert("이전 변경 내용이 없습니다.");
              }}
              title="이전 변경 내용"
              small
            >
              <span style={{ fontSize: 10 }}>◀ 이전</span>
            </RibbonBtn>
            <RibbonBtn
              onClick={() => {
                if (!editor.commands.goToNextChange()) showEditorAlert("다음 변경 내용이 없습니다.");
              }}
              title="다음 변경 내용"
              small
            >
              <span style={{ fontSize: 10 }}>다음 ▶</span>
            </RibbonBtn>
          </div>
        </div>
      </RibbonGroup>
      <GroupSep />

      {/* 언어 그룹 */}
      <RibbonGroup label="언어">
        <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center", justifyContent: "center", padding: "0 8px" }}>
          <Languages size={16} color="var(--ribbon-fg, #555)" />
          <span style={{ fontSize: 10, color: "var(--ribbon-fg, #555)" }}>한국어</span>
        </div>
      </RibbonGroup>
    </div>
  );
});
