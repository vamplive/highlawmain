/**
 * LayoutTab.jsx — 에디터 리본 "레이아웃" 탭
 * 여백, 용지 방향/크기, 단 나누기, 페이지/구역 나누기, 들여쓰기/간격을 제공한다.
 */

import { memo } from "react";
import {
  Columns2, SeparatorHorizontal, LayoutTemplate,
  SplitSquareVertical, FileDown,
} from "lucide-react";
import { RibbonBtn, GroupSep, RibbonGroup, DropdownButton } from "./RibbonParts";
import { MARGIN_PRESETS, PAGE_SIZES } from "./constants";

export const LayoutTab = memo(function LayoutTab({ margins, setMargins, orientation, setOrientation, pageSize, setPageSize, columns, setColumns, onOpenPageSetupDialog, editor }) {
  const insertPageBreak = () => {
    if (!editor) return;
    try {
      editor.chain().focus().setPageBreak().run();
    } catch {
      editor.chain().focus().setHorizontalRule().run();
    }
  };

  /** 단 나누기 옵션 */
  const COLUMN_OPTIONS = [
    { v: 1, l: "1단", desc: "단 없음", icon: "▌" },
    { v: 2, l: "2단", desc: "2개의 동일한 열", icon: "▌▌" },
    { v: 3, l: "3단", desc: "3개의 동일한 열", icon: "▌▌▌" },
  ];

  return (
    <div style={{ display: "flex", alignItems: "stretch", background: "var(--ribbon-bg, #fff)", borderBottom: "1px solid var(--ribbon-sep, #d1d5db)", flexShrink: 0, minHeight: 84, padding: "0 2px" }}>
      {/* 페이지 설정 그룹 */}
      <RibbonGroup label="페이지 설정" dialogLauncher={onOpenPageSetupDialog}>
        <div style={{ display: "flex", gap: 6 }}>
          {/* 여백 */}
          <DropdownButton trigger={
            <div className="word-ribbon-btn" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 8px", cursor: "pointer", border: "1px solid transparent", borderRadius: 3 }}>
              <LayoutTemplate size={20} color="var(--ribbon-fg, #555)" />
              <span style={{ fontSize: 9, marginTop: 2, color: "var(--ribbon-fg, #555)" }}>여백 ▾</span>
            </div>
          }>
            <div style={{ padding: 4, minWidth: 220 }}>
              <div style={{ fontSize: 10, color: "#888", padding: "4px 8px", fontWeight: 600 }}>여백</div>
              {MARGIN_PRESETS.map(m => (
                <button key={m.value} className={`word-dropdown-item${margins === m.value ? " active" : ""}`}
                  onMouseDown={(e) => { e.preventDefault(); setMargins(m.value); }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: "#888" }}>{m.desc}</div>
                  </div>
                  <div style={{ width: 40, height: 50, border: "1px solid #ccc", borderRadius: 2, position: "relative", background: "#fff", flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ position: "absolute", top: `${(m.top / 96) * 20}%`, left: `${(m.left / 120) * 15}%`, right: `${(m.right / 120) * 15}%`, bottom: `${(m.bottom / 96) * 20}%`, background: "#e8f0fe", borderRadius: 1 }} />
                  </div>
                </button>
              ))}
              <div style={{ height: 1, background: "#e5e5e5", margin: "4px 0" }} />
              <button className={`word-dropdown-item${margins === "custom" ? " active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); onOpenPageSetupDialog?.(); }}>
                <span style={{ fontWeight: 500 }}>사용자 지정 여백...</span>
              </button>
            </div>
          </DropdownButton>

          {/* 방향 */}
          <DropdownButton trigger={
            <div className="word-ribbon-btn" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 8px", cursor: "pointer", border: "1px solid transparent", borderRadius: 3 }}>
              <SplitSquareVertical size={20} color="var(--ribbon-fg, #555)" style={orientation === "landscape" ? { transform: "rotate(90deg)" } : {}} />
              <span style={{ fontSize: 9, marginTop: 2, color: "var(--ribbon-fg, #555)" }}>방향 ▾</span>
            </div>
          }>
            <div style={{ padding: 4, minWidth: 180 }}>
              <div style={{ fontSize: 10, color: "#888", padding: "4px 8px", fontWeight: 600 }}>용지 방향</div>
              <button className={`word-dropdown-item${orientation === "portrait" ? " active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); setOrientation("portrait"); }}
                style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 24, height: 32, border: "1px solid #888", borderRadius: 2, background: orientation === "portrait" ? "#dbeafe" : "#fff" }} />
                <span>세로</span>
              </button>
              <button className={`word-dropdown-item${orientation === "landscape" ? " active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); setOrientation("landscape"); }}
                style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 24, border: "1px solid #888", borderRadius: 2, background: orientation === "landscape" ? "#dbeafe" : "#fff" }} />
                <span>가로</span>
              </button>
            </div>
          </DropdownButton>

          {/* 크기 */}
          <DropdownButton trigger={
            <div className="word-ribbon-btn" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 8px", cursor: "pointer", border: "1px solid transparent", borderRadius: 3 }}>
              <FileDown size={20} color="var(--ribbon-fg, #555)" />
              <span style={{ fontSize: 9, marginTop: 2, color: "var(--ribbon-fg, #555)" }}>크기 ▾</span>
            </div>
          }>
            <div style={{ padding: 4, minWidth: 240 }}>
              <div style={{ fontSize: 10, color: "#888", padding: "4px 8px", fontWeight: 600 }}>용지 크기</div>
              {PAGE_SIZES.map(p => (
                <button key={p.value} className={`word-dropdown-item${pageSize === p.value ? " active" : ""}`}
                  onMouseDown={(e) => { e.preventDefault(); setPageSize(p.value); }}
                  style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 500 }}>{p.label}</span>
                  <span style={{ fontSize: 10, color: "#888" }}>{p.desc}</span>
                </button>
              ))}
            </div>
          </DropdownButton>
        </div>
      </RibbonGroup>
      <GroupSep />

      {/* 단 그룹 */}
      <RibbonGroup label="단">
        <DropdownButton trigger={
          <div className="word-ribbon-btn" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 8px", cursor: "pointer", border: "1px solid transparent", borderRadius: 3 }}>
            <Columns2 size={20} color="var(--ribbon-fg, #555)" />
            <span style={{ fontSize: 9, marginTop: 2, color: "var(--ribbon-fg, #555)" }}>단 ▾</span>
          </div>
        }>
          <div style={{ padding: 4, minWidth: 180 }}>
            <div style={{ fontSize: 10, color: "#888", padding: "4px 8px", fontWeight: 600 }}>단</div>
            {COLUMN_OPTIONS.map(c => (
              <button key={c.v} className={`word-dropdown-item${columns === c.v ? " active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); setColumns(c.v); }}
                style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14, letterSpacing: 2, width: 30 }}>{c.icon}</span>
                <div>
                  <div style={{ fontWeight: 500 }}>{c.l}</div>
                  <div style={{ fontSize: 10, color: "#888" }}>{c.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </DropdownButton>
      </RibbonGroup>
      <GroupSep />

      {/* 나누기 그룹 */}
      <RibbonGroup label="나누기">
        <DropdownButton trigger={
          <div className="word-ribbon-btn" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 8px", cursor: "pointer", border: "1px solid transparent", borderRadius: 3 }}>
            <SeparatorHorizontal size={20} color="var(--ribbon-fg, #555)" />
            <span style={{ fontSize: 9, marginTop: 2, color: "var(--ribbon-fg, #555)" }}>나누기 ▾</span>
          </div>
        }>
          <div style={{ padding: 4, minWidth: 240 }}>
            <div style={{ fontSize: 10, color: "#888", padding: "4px 8px", fontWeight: 600 }}>페이지 나누기</div>
            <button className="word-dropdown-item"
              onMouseDown={(e) => { e.preventDefault(); insertPageBreak(); }}>
              <div style={{ fontWeight: 500 }}>페이지 나누기</div>
              <div style={{ fontSize: 10, color: "#888" }}>다음 페이지의 시작 부분으로 이동</div>
            </button>
            <button className="word-dropdown-item"
              onMouseDown={(e) => { e.preventDefault(); try { editor?.chain().focus().setColumnBreak().run(); } catch { editor?.chain().focus().enter().run(); } }}>
              <div style={{ fontWeight: 500 }}>단 나누기</div>
              <div style={{ fontSize: 10, color: "#888" }}>다음 단의 시작 부분으로 이동</div>
            </button>
            <button className="word-dropdown-item"
              onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().insertContent('<p style="text-wrap: nowrap; overflow-wrap: normal;"></p>').run(); }}>
              <div style={{ fontWeight: 500 }}>텍스트 줄 바꿈</div>
              <div style={{ fontSize: 10, color: "#888" }}>다음 줄에서 텍스트 계속</div>
            </button>
            <div style={{ height: 1, background: "#e5e5e5", margin: "4px 0" }} />
            <div style={{ fontSize: 10, color: "#888", padding: "4px 8px", fontWeight: 600 }}>구역 나누기</div>
            <button className="word-dropdown-item"
              onMouseDown={(e) => { e.preventDefault(); try { editor?.chain().focus().setSectionBreak("next-page").run(); } catch { insertPageBreak(); } }}>
              <div style={{ fontWeight: 500 }}>다음 페이지</div>
              <div style={{ fontSize: 10, color: "#888" }}>구역 나누기를 삽입하고 다음 페이지에서 시작</div>
            </button>
            <button className="word-dropdown-item"
              onMouseDown={(e) => { e.preventDefault(); try { editor?.chain().focus().setSectionBreak("continuous").run(); } catch { editor?.chain().focus().setHorizontalRule().run(); } }}>
              <div style={{ fontWeight: 500 }}>연속</div>
              <div style={{ fontSize: 10, color: "#888" }}>같은 페이지에서 새 구역 시작</div>
            </button>
          </div>
        </DropdownButton>
      </RibbonGroup>
      <GroupSep />

      {/* 들여쓰기 / 간격 그룹 */}
      <RibbonGroup label="단락">
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 9, color: "var(--ribbon-label, #888)" }}>들여쓰기</span>
            <div style={{ display: "flex", gap: 2 }}>
              <RibbonBtn onClick={() => editor?.commands.decreaseIndent()} title="들여쓰기 줄이기" small>
                <span style={{ fontSize: 10 }}>◀</span>
              </RibbonBtn>
              <RibbonBtn onClick={() => editor?.commands.increaseIndent()} title="들여쓰기 늘리기" small>
                <span style={{ fontSize: 10 }}>▶</span>
              </RibbonBtn>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 9, color: "var(--ribbon-label, #888)" }}>간격</span>
            <div style={{ display: "flex", gap: 2 }}>
              <RibbonBtn onClick={() => editor?.commands.setSpacingBefore("6pt")} title="앞에 간격 추가" small>
                <span style={{ fontSize: 10 }}>▲</span>
              </RibbonBtn>
              <RibbonBtn onClick={() => editor?.commands.setSpacingAfter("6pt")} title="뒤에 간격 추가" small>
                <span style={{ fontSize: 10 }}>▼</span>
              </RibbonBtn>
            </div>
          </div>
        </div>
      </RibbonGroup>
    </div>
  );
});
