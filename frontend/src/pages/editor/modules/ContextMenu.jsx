/**
 * ContextMenu — MS Word 스타일 우클릭 컨텍스트 메뉴
 * 설정 기반(config-driven) 렌더링으로 메뉴 항목을 contextMenuItems.js에서 가져와 표시
 */
import { useState, useEffect, useRef } from "react";
import { Reply, Check, Trash2 } from "lucide-react";
import {
  UNDO_REDO_ITEMS, CLIPBOARD_ITEMS, FORMAT_ITEMS,
  ALIGNMENT_ITEMS, STYLE_ITEMS, LIST_ITEMS, INDENT_ITEMS,
  INSERT_ITEMS, COMMENT_ITEM, TABLE_ITEMS, DIALOG_ITEMS,
  CLEAR_FORMAT_ITEM, SUBMENU_ICONS,
} from "./contextMenuItems.jsx";

const ICON_SIZE = 14;

/* ── 메뉴 아이템 렌더링 ── */
function MenuItem({ icon, label, shortcut, onClick, danger, disabled, dividerAfter }) {
  return (
    <>
      <button
        type="button"
        className="ctx-menu-item"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); if (!disabled) onClick?.(); }}
        disabled={disabled}
        style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          padding: "6px 12px 6px 8px", border: "none",
          background: "transparent", cursor: disabled ? "default" : "pointer",
          fontSize: 12, textAlign: "left", color: danger ? "#dc2626" : disabled ? "#bbb" : "#333",
          fontFamily: "'Segoe UI', '맑은 고딕', sans-serif",
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = "#eff6ff"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >
        <span style={{ width: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {icon}
        </span>
        <span style={{ flex: 1 }}>{label}</span>
        {shortcut && <span style={{ fontSize: 10, color: "#999", marginLeft: 12 }}>{shortcut}</span>}
      </button>
      {dividerAfter && <div style={{ height: 1, background: "#e5e5e5", margin: "3px 0" }} />}
    </>
  );
}

/* ── 하위메뉴 ── */
function SubMenu({ icon, label, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button" className="ctx-menu-item"
        style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          padding: "6px 12px 6px 8px", border: "none",
          background: "transparent", cursor: "pointer",
          fontSize: 12, textAlign: "left", color: "#333",
          fontFamily: "'Segoe UI', '맑은 고딕', sans-serif",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <span style={{ width: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        <span style={{ fontSize: 10, color: "#999" }}>▶</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", left: "100%", top: -4,
          background: "#fff", border: "1px solid #d1d5db", borderRadius: 4,
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 160,
          padding: "4px 0", zIndex: 10,
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ── 설정 배열 기반 메뉴 항목 렌더링 ── */
function renderItems(items, handlers, disabledState, activeState) {
  return items.map((item, i) => {
    if (item.dividerOnly) {
      return <div key={i} style={{ height: 1, background: "#e5e5e5", margin: "3px 0" }} />;
    }
    const disabled = item.disabledKey ? disabledState[item.disabledKey] : false;
    const label = (item.activeKey && activeState[item.activeKey] && item.labelIfActive)
      ? item.labelIfActive : item.label;
    return (
      <MenuItem
        key={item.action}
        icon={item.icon}
        label={label}
        shortcut={item.shortcut}
        danger={item.danger}
        disabled={disabled}
        dividerAfter={item.dividerAfter}
        onClick={() => handlers[item.action]?.()}
      />
    );
  });
}

/* ── 에디터 액션 핸들러 생성 ── */
function buildActionHandlers(editor, close, callbacks) {
  const exec = (fn) => { fn(); close(); };
  const chain = () => editor.chain().focus();

  return {
    // 실행취소/다시실행
    undo: () => exec(() => chain().undo().run()),
    redo: () => exec(() => chain().redo().run()),

    // 클립보드
    cut: () => exec(() => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, "\n");
      navigator.clipboard.writeText(text).then(() => {
        chain().deleteSelection().run();
      }).catch(() => document.execCommand("cut"));
    }),
    copy: () => exec(() => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, "\n");
      navigator.clipboard.writeText(text).catch(() => document.execCommand("copy"));
    }),
    paste: () => exec(() => {
      navigator.clipboard.readText().then(t => {
        chain().insertContent(t).run();
      }).catch(() => {});
    }),
    pastePlain: () => exec(() => {
      navigator.clipboard.readText().then(t => {
        chain().insertContent({ type: "text", text: t }).run();
      }).catch(() => {});
    }),

    // 서식
    bold: () => exec(() => chain().toggleBold().run()),
    italic: () => exec(() => chain().toggleItalic().run()),
    underline: () => exec(() => chain().toggleUnderline().run()),

    // 정렬
    alignLeft: () => exec(() => chain().setTextAlign("left").run()),
    alignCenter: () => exec(() => chain().setTextAlign("center").run()),
    alignRight: () => exec(() => chain().setTextAlign("right").run()),
    alignJustify: () => exec(() => chain().setTextAlign("justify").run()),

    // 스타일
    paragraph: () => exec(() => chain().setParagraph().run()),
    heading1: () => exec(() => chain().toggleHeading({ level: 1 }).run()),
    heading2: () => exec(() => chain().toggleHeading({ level: 2 }).run()),
    heading3: () => exec(() => chain().toggleHeading({ level: 3 }).run()),

    // 목록
    bulletList: () => exec(() => chain().toggleBulletList().run()),
    orderedList: () => exec(() => chain().toggleOrderedList().run()),

    // 들여쓰기
    indent: () => exec(() => chain().increaseIndent().run()),
    outdent: () => exec(() => chain().decreaseIndent().run()),

    // 삽입
    hyperlink: () => exec(() => callbacks.onOpenHyperlinkDialog?.()),
    insertImage: () => exec(() => {
      const input = document.createElement("input");
      input.type = "file"; input.accept = "image/*";
      input.onchange = (ev) => {
        const file = ev.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => editor.chain().focus().setImage({ src: reader.result }).run();
        reader.readAsDataURL(file);
      };
      input.click();
    }),

    // 메모
    insertComment: () => exec(() => callbacks.onInsertComment?.()),

    // 표 조작
    addRowBefore: () => exec(() => chain().addRowBefore().run()),
    addRowAfter: () => exec(() => chain().addRowAfter().run()),
    addColumnBefore: () => exec(() => chain().addColumnBefore().run()),
    addColumnAfter: () => exec(() => chain().addColumnAfter().run()),
    deleteRow: () => exec(() => chain().deleteRow().run()),
    deleteColumn: () => exec(() => chain().deleteColumn().run()),
    mergeCells: () => exec(() => chain().mergeCells().run()),
    splitCell: () => exec(() => chain().splitCell().run()),
    deleteTable: () => exec(() => chain().deleteTable().run()),

    // 대화상자
    fontDialog: () => exec(() => callbacks.onOpenFontDialog?.()),
    paragraphDialog: () => exec(() => callbacks.onOpenParagraphDialog?.()),

    // 서식 지우기
    clearFormat: () => exec(() => chain().clearNodes().unsetAllMarks().run()),
  };
}

export function ContextMenu({ editor, onOpenFontDialog, onOpenParagraphDialog, onOpenHyperlinkDialog, onInsertComment, commentStore, commentDispatch, commentAuthor }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef(null);

  useEffect(() => {
    if (!editor) return;

    const handleContextMenu = (e) => {
      if (!editor.view.dom.contains(e.target)) return;
      e.preventDefault();
      e.stopPropagation();

      const x = Math.min(e.clientX, window.innerWidth - 220);
      const y = Math.min(e.clientY, window.innerHeight - 400);
      setPosition({ x, y });
      setVisible(true);
    };

    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setVisible(false);
      }
    };

    const handleScroll = () => setVisible(false);

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [editor]);

  const close = () => setVisible(false);

  if (!visible || !editor) return null;

  const hasSelection = !editor.state.selection.empty;
  const isTable = editor.isActive("table");
  const isLink = editor.isActive("link");

  const disabledState = {
    cannotUndo: !editor.can().undo(),
    cannotRedo: !editor.can().redo(),
    noSelection: !hasSelection,
  };

  const activeState = { isLink };

  const callbacks = { onOpenFontDialog, onOpenParagraphDialog, onOpenHyperlinkDialog, onInsertComment };
  const handlers = buildActionHandlers(editor, close, callbacks);

  /* 커서 위치의 메모 마크 확인 */
  const $from = editor.state.selection.$from;
  const commentMark = $from.marks().find(m => m.type.name === "comment");

  return (
    <div ref={menuRef} style={{
      position: "fixed", left: position.x, top: position.y, zIndex: 5000,
      background: "#fff", border: "1px solid #d1d5db", borderRadius: 6,
      boxShadow: "0 6px 24px rgba(0,0,0,0.15)", minWidth: 200,
      padding: "4px 0", animation: "ctxIn 0.1s ease-out",
    }}>
      {renderItems(UNDO_REDO_ITEMS, handlers, disabledState, activeState)}
      {renderItems(CLIPBOARD_ITEMS, handlers, disabledState, activeState)}

      {hasSelection && renderItems(FORMAT_ITEMS, handlers, disabledState, activeState)}

      <SubMenu icon={SUBMENU_ICONS.alignment} label="단락 정렬">
        {renderItems(ALIGNMENT_ITEMS, handlers, disabledState, activeState)}
      </SubMenu>

      <SubMenu icon={SUBMENU_ICONS.style} label="스타일">
        {renderItems(STYLE_ITEMS, handlers, disabledState, activeState)}
      </SubMenu>

      <SubMenu icon={SUBMENU_ICONS.list} label="목록">
        {renderItems(LIST_ITEMS, handlers, disabledState, activeState)}
      </SubMenu>

      <div style={{ height: 1, background: "#e5e5e5", margin: "3px 0" }} />

      {renderItems(INDENT_ITEMS, handlers, disabledState, activeState)}
      {renderItems(INSERT_ITEMS, handlers, disabledState, activeState)}

      {/* 메모 항목 */}
      <MenuItem
        icon={COMMENT_ITEM.icon} label={COMMENT_ITEM.label} shortcut={COMMENT_ITEM.shortcut}
        onClick={() => handlers[COMMENT_ITEM.action]?.()}
      />
      {commentMark && commentStore && commentDispatch && (() => {
        const cid = commentMark.attrs.commentId;
        const comment = commentStore.comments[cid];
        return (
          <>
            <MenuItem icon={<Reply size={ICON_SIZE} />} label="메모에 답글 달기"
              onClick={() => {
                commentDispatch({ type: "SET_ACTIVE", id: cid });
                commentDispatch({ type: "SET_PANEL_VISIBLE", visible: true });
                if (commentStore.markupMode !== "all") commentDispatch({ type: "SET_MARKUP_MODE", mode: "all" });
                close();
              }} />
            <MenuItem icon={<Check size={ICON_SIZE} />} label="메모 해결"
              onClick={() => { commentDispatch({ type: "RESOLVE_COMMENT", id: cid, author: commentAuthor }); close(); }}
              disabled={comment?.resolved} />
            <MenuItem icon={<Trash2 size={ICON_SIZE} />} label="메모 삭제" danger
              onClick={() => {
                editor.commands.unsetComment(cid);
                commentDispatch({ type: "DELETE_COMMENT", id: cid });
                close();
              }} />
          </>
        );
      })()}
      <div style={{ height: 1, background: "#e5e5e5", margin: "3px 0" }} />

      {/* 표 조작 */}
      {isTable && (
        <>
          <SubMenu icon={SUBMENU_ICONS.table} label="표 조작">
            {renderItems(TABLE_ITEMS, handlers, disabledState, activeState)}
          </SubMenu>
          <div style={{ height: 1, background: "#e5e5e5", margin: "3px 0" }} />
        </>
      )}

      {renderItems(DIALOG_ITEMS, handlers, disabledState, activeState)}

      <div style={{ height: 1, background: "#e5e5e5", margin: "3px 0" }} />
      <MenuItem
        icon={CLEAR_FORMAT_ITEM.icon} label={CLEAR_FORMAT_ITEM.label}
        disabled={!hasSelection}
        onClick={() => handlers[CLEAR_FORMAT_ITEM.action]?.()}
      />
    </div>
  );
}
