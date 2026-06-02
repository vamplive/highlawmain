/**
 * 스타일 갤러리 - Word 스타일 프리셋 카드 (제목, 본문, 인용 등)
 */
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RibbonGroup } from "./RibbonParts";
import { STYLE_PRESETS } from "./constants";

/** 에디터 isActive 안전 호출 */
function safeIsActive(editor, ...args) {
  try { return editor.isActive(...args); } catch { return false; }
}

/**
 * 현재 활성화된 heading 레벨을 문자열로 반환한다.
 * @returns {"0"|"1"|"2"|"3"|"4"} heading 레벨 (0 = 일반 단락)
 */
function getCurrentHeading(editor) {
  for (let level = 1; level <= 4; level++) {
    if (safeIsActive(editor, "heading", { level })) return String(level);
  }
  return "0";
}

/**
 * 프리셋이 현재 에디터 상태와 일치하는지 판별한다.
 */
function isPresetActive(preset, currentHeading, editor) {
  if (preset.id === "normal" && currentHeading === "0") return true;
  if (preset.id === "quote" && safeIsActive(editor, "blockquote")) return true;
  const headingMatch = preset.id.match(/^heading(\d)$/);
  if (headingMatch && currentHeading === headingMatch[1]) return true;
  return false;
}

/**
 * 스타일 프리셋을 에디터에 적용한다.
 */
function applyStyle(editor, preset) {
  if (preset.tag === "blockquote") {
    editor.chain().focus().toggleBlockquote().run();
  } else if (preset.tag.startsWith("h")) {
    editor.chain().focus().toggleHeading({ level: parseInt(preset.tag[1]) }).run();
  } else {
    editor.chain().focus().setParagraph().run();
  }
}

/** 스크롤 네비게이션 버튼 공통 스타일 */
const scrollBtnStyle = {
  border: "1px solid var(--ribbon-sep, #d5d5d5)",
  background: "var(--ribbon-bg, #f8f8f8)",
  borderRadius: 2, cursor: "pointer", padding: "6px 2px",
  color: "var(--ribbon-fg, #888)", flexShrink: 0, display: "flex",
};

export function StyleGallery({ editor }) {
  const galleryRef = useRef(null);
  const currentHeading = getCurrentHeading(editor);

  const scroll = (direction) => {
    galleryRef.current?.scrollBy({ left: direction * 200, behavior: "smooth" });
  };

  return (
    <RibbonGroup label="스타일">
      <div style={{ display: "flex", alignItems: "center", gap: 2, maxWidth: 360 }}>
        <button type="button" onClick={() => scroll(-1)} style={scrollBtnStyle}>
          <ChevronLeft size={10} />
        </button>

        <div ref={galleryRef} style={{ display: "flex", gap: 3, overflow: "hidden", flex: 1 }}>
          {STYLE_PRESETS.map(preset => {
            const active = isPresetActive(preset, currentHeading, editor);
            return (
              <button key={preset.id} type="button" className="word-style-card"
                onClick={() => applyStyle(editor, preset)}
                style={{
                  width: 64, height: 54, flexShrink: 0,
                  border: active ? "2px solid #3b82f6" : "1px solid var(--ribbon-sep, #c0c0c0)",
                  borderRadius: 3, background: "var(--ribbon-bg, #fff)", cursor: "pointer",
                  padding: "3px 4px 2px", display: "flex", flexDirection: "column",
                  justifyContent: "space-between", overflow: "hidden",
                }}>
                <span style={{
                  fontSize: parseInt(preset.fontSize) > 14 ? 12 : 10,
                  color: preset.color, fontWeight: preset.fontWeight,
                  fontStyle: preset.fontStyle || "normal", lineHeight: 1.2,
                  fontFamily: preset.fontFamily, overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>가나다Aa</span>
                <span style={{ fontSize: 8, color: "var(--ribbon-label, #888)" }}>{preset.label}</span>
              </button>
            );
          })}
        </div>

        <button type="button" onClick={() => scroll(1)} style={scrollBtnStyle}>
          <ChevronRight size={10} />
        </button>
      </div>
    </RibbonGroup>
  );
}
