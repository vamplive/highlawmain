/**
 * MobileSlashMenu — Notion 스타일 슬래시 명령어 메뉴
 *
 * 사용자가 빈 줄 시작이나 단어 경계에서 "/"를 입력하면 메뉴가 떠서
 * 헤딩, 리스트, 인용, 표, 이미지, 체크리스트, 구분선, 코드 블록, 콜아웃 등을 즉시 삽입한다.
 *
 * 구현: TipTap의 transaction을 구독하여 현재 줄에 `/검색어` 패턴이 있으면 메뉴를 띄우고,
 * 사용자가 항목 선택 시 해당 슬래시 패턴을 삭제 후 명령어 실행.
 */
import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Heading1, Heading2, Heading3, List, ListOrdered, ListChecks, Quote,
  Minus, Code2, Table2, Image as ImageIcon, MessageSquarePlus, Pilcrow,
} from "lucide-react";
import { useHapticFeedback } from "./mobileHooks";

const ICON = 18;

function buildCommands({ onOpenImage, onOpenTable, onInsertComment }) {
  return [
    {
      id: "h1", label: "큰 제목", desc: "섹션 시작",
      icon: <Heading1 size={ICON} />, keywords: ["h1", "제목", "큰", "title"],
      run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      id: "h2", label: "중간 제목", desc: "주요 부제",
      icon: <Heading2 size={ICON} />, keywords: ["h2", "중제목"],
      run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      id: "h3", label: "작은 제목", desc: "서브 섹션",
      icon: <Heading3 size={ICON} />, keywords: ["h3"],
      run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      id: "p", label: "본문", desc: "일반 단락",
      icon: <Pilcrow size={ICON} />, keywords: ["p", "본문", "단락"],
      run: (e) => e.chain().focus().setParagraph().run(),
    },
    {
      id: "ul", label: "글머리 기호", desc: "•",
      icon: <List size={ICON} />, keywords: ["bullet", "ul", "리스트"],
      run: (e) => e.chain().focus().toggleBulletList().run(),
    },
    {
      id: "ol", label: "번호 매기기", desc: "1. 2. 3.",
      icon: <ListOrdered size={ICON} />, keywords: ["ol", "번호", "ordered"],
      run: (e) => e.chain().focus().toggleOrderedList().run(),
    },
    {
      id: "tasks", label: "체크리스트", desc: "할 일",
      icon: <ListChecks size={ICON} />, keywords: ["task", "todo", "체크"],
      run: (e) => e.chain().focus().toggleTaskList?.()?.run(),
    },
    {
      id: "quote", label: "인용", desc: "강조 인용문",
      icon: <Quote size={ICON} />, keywords: ["quote", "인용"],
      run: (e) => e.chain().focus().toggleBlockquote().run(),
    },
    {
      id: "code", label: "코드 블록", desc: "monospace",
      icon: <Code2 size={ICON} />, keywords: ["code", "코드"],
      run: (e) => e.chain().focus().toggleCodeBlock?.()?.run(),
    },
    {
      id: "hr", label: "구분선", desc: "수평선",
      icon: <Minus size={ICON} />, keywords: ["hr", "divider", "구분"],
      run: (e) => e.chain().focus().setHorizontalRule().run(),
    },
    {
      id: "image", label: "이미지", desc: "사진·그림",
      icon: <ImageIcon size={ICON} />, keywords: ["image", "이미지", "사진", "그림"],
      run: () => onOpenImage?.(),
    },
    {
      id: "table", label: "표", desc: "행/열",
      icon: <Table2 size={ICON} />, keywords: ["table", "표"],
      run: () => onOpenTable?.(),
    },
    {
      id: "comment", label: "댓글", desc: "협업 메모",
      icon: <MessageSquarePlus size={ICON} />, keywords: ["comment", "댓글"],
      run: () => onInsertComment?.(),
    },
  ];
}

export const MobileSlashMenu = memo(function MobileSlashMenu({
  editor,
  onOpenImage,
  onOpenTable,
  onInsertComment,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRangeRef = useRef(null);
  const haptic = useHapticFeedback();

  const commands = useMemo(() => buildCommands({ onOpenImage, onOpenTable, onInsertComment }), [onOpenImage, onOpenTable, onInsertComment]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      c.label.toLowerCase().includes(q) ||
      c.keywords.some((k) => k.toLowerCase().includes(q)),
    );
  }, [commands, query]);

  // editor의 현재 텍스트를 분석하여 "/검색어" 패턴 탐지
  useEffect(() => {
    if (!editor) return undefined;
    const sync = () => {
      try {
        const { from, empty } = editor.state.selection;
        if (!empty) { setOpen(false); return; }
        // 현재 텍스트 노드에서 슬래시 위치 찾기 (최대 32자 전까지 탐색)
        const $from = editor.state.selection.$from;
        const start = Math.max(0, from - 32);
        const text = editor.state.doc.textBetween(start, from, "\n", "\0");
        const match = /(^|\s)\/([\wㄱ-힣]*)$/.exec(text);
        if (!match) { setOpen(false); return; }
        const slashOffset = match.index + match[1].length; // text 안에서 "/" 위치
        const slashFrom = start + slashOffset;
        triggerRangeRef.current = { from: slashFrom, to: from };
        setQuery(match[2] || "");
        setActiveIndex(0);
        setOpen(true);
        // 단락 시작인지(부모 노드 시작)인지 확인 — 모든 곳에서 노출하지 않고
        // 현재는 `/` 앞이 공백/줄바꿈/시작이면 표시 (이미 정규식에서 보장)
        // 단, 마지막 글자가 공백이면 닫기
        const lastChar = text.slice(-1);
        if (lastChar === " ") setOpen(false);
        // 노드 첫 위치인지 추가 보장: $from.parentOffset이 query 길이 + 1 이하일 때만 (단락 시작 부근)
        const offsetInBlock = $from.parentOffset;
        if (offsetInBlock > (match[2]?.length || 0) + 1 && !/[\n]/.test(match[1] || "")) {
          // 단락 중간에서 슬래시는 무시 (오작동 방지)
          // 단, 직전이 공백이면 허용
          if (match[1] !== " " && match[1] !== "\n") setOpen(false);
        }
      } catch {
        setOpen(false);
      }
    };
    editor.on("selectionUpdate", sync);
    editor.on("transaction", sync);
    return () => {
      editor.off("selectionUpdate", sync);
      editor.off("transaction", sync);
    };
  }, [editor]);

  const close = () => { setOpen(false); setQuery(""); };

  const select = (cmd) => {
    if (!editor || !cmd) return;
    const range = triggerRangeRef.current;
    haptic(12);
    if (range) {
      editor.chain().focus().deleteRange(range).run();
    }
    cmd.run(editor);
    close();
  };

  if (!open || filtered.length === 0) return null;

  return (
    <div className="editor-mslash editor-mobile-only" role="listbox" aria-label="슬래시 명령어">
      <div className="mslash-handle" />
      <div className="mslash-header">
        <span>/{query}</span>
        <button type="button" onClick={close} aria-label="닫기">×</button>
      </div>
      <div className="mslash-list">
        {filtered.map((cmd, i) => (
          <button
            key={cmd.id}
            type="button"
            className={`mslash-item${i === activeIndex ? " active" : ""}`}
            onMouseDown={(e) => { e.preventDefault(); select(cmd); }}
            role="option"
            aria-selected={i === activeIndex}
          >
            <span className="mslash-icon">{cmd.icon}</span>
            <span className="mslash-text">
              <span className="mslash-label">{cmd.label}</span>
              <span className="mslash-desc">{cmd.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});

export default MobileSlashMenu;
