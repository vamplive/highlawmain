/**
 * contextMenuItems — 컨텍스트 메뉴 항목 설정 데이터
 * 메뉴 렌더링을 설정 기반(config-driven)으로 처리하기 위한 항목 배열
 *
 * action 문자열은 ContextMenu.jsx의 actionHandlers에서 실행 함수로 매핑됨
 */
import {
  Scissors, Copy, ClipboardPaste, Bold, Italic, Underline,
  Link2, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Table2, Image as ImageIcon, Trash2,
  RotateCcw, RotateCw, Paintbrush,
  Heading1, Heading2, Heading3, Minus, Indent, Outdent,
  MessageSquare,
} from "lucide-react";

const ICON_SIZE = 14;

/** 실행취소/다시실행 항목 */
export const UNDO_REDO_ITEMS = [
  { icon: <RotateCcw size={ICON_SIZE} />, label: "실행 취소", shortcut: "Ctrl+Z", action: "undo", disabledKey: "cannotUndo" },
  { icon: <RotateCw size={ICON_SIZE} />, label: "다시 실행", shortcut: "Ctrl+Y", action: "redo", disabledKey: "cannotRedo", dividerAfter: true },
];

/** 클립보드 항목 */
export const CLIPBOARD_ITEMS = [
  { icon: <Scissors size={ICON_SIZE} />, label: "잘라내기", shortcut: "Ctrl+X", action: "cut", disabledKey: "noSelection" },
  { icon: <Copy size={ICON_SIZE} />, label: "복사", shortcut: "Ctrl+C", action: "copy", disabledKey: "noSelection" },
  { icon: <ClipboardPaste size={ICON_SIZE} />, label: "붙여넣기", shortcut: "Ctrl+V", action: "paste" },
  { icon: <ClipboardPaste size={ICON_SIZE} />, label: "서식 없이 붙여넣기", shortcut: "Ctrl+Shift+V", action: "pastePlain", dividerAfter: true },
];

/** 서식 항목 (텍스트 선택 시에만 표시) */
export const FORMAT_ITEMS = [
  { icon: <Bold size={ICON_SIZE} />, label: "굵게", shortcut: "Ctrl+B", action: "bold" },
  { icon: <Italic size={ICON_SIZE} />, label: "기울임", shortcut: "Ctrl+I", action: "italic" },
  { icon: <Underline size={ICON_SIZE} />, label: "밑줄", shortcut: "Ctrl+U", action: "underline", dividerAfter: true },
];

/** 정렬 하위메뉴 항목 */
export const ALIGNMENT_ITEMS = [
  { icon: <AlignLeft size={ICON_SIZE} />, label: "왼쪽 맞춤", action: "alignLeft" },
  { icon: <AlignCenter size={ICON_SIZE} />, label: "가운데 맞춤", action: "alignCenter" },
  { icon: <AlignRight size={ICON_SIZE} />, label: "오른쪽 맞춤", action: "alignRight" },
  { icon: <AlignJustify size={ICON_SIZE} />, label: "양쪽 맞춤", action: "alignJustify" },
];

/** 스타일(제목) 하위메뉴 항목 */
export const STYLE_ITEMS = [
  { icon: <Type size={ICON_SIZE} />, label: "본문", action: "paragraph" },
  { icon: <Heading1 size={ICON_SIZE} />, label: "제목 1", action: "heading1" },
  { icon: <Heading2 size={ICON_SIZE} />, label: "제목 2", action: "heading2" },
  { icon: <Heading3 size={ICON_SIZE} />, label: "제목 3", action: "heading3" },
];

/** 목록 하위메뉴 항목 */
export const LIST_ITEMS = [
  { icon: <List size={ICON_SIZE} />, label: "글머리 기호", action: "bulletList" },
  { icon: <ListOrdered size={ICON_SIZE} />, label: "번호 매기기", action: "orderedList" },
];

/** 들여쓰기 항목 */
export const INDENT_ITEMS = [
  { icon: <Indent size={ICON_SIZE} />, label: "들여쓰기", shortcut: "Tab", action: "indent" },
  { icon: <Outdent size={ICON_SIZE} />, label: "내어쓰기", shortcut: "Shift+Tab", action: "outdent", dividerAfter: true },
];

/** 삽입 항목 (링크, 이미지) */
export const INSERT_ITEMS = [
  { icon: <Link2 size={ICON_SIZE} />, label: "하이퍼링크...", labelIfActive: "링크 편집...", shortcut: "Ctrl+K", action: "hyperlink", activeKey: "isLink" },
  { icon: <ImageIcon size={ICON_SIZE} />, label: "그림 삽입...", action: "insertImage", dividerAfter: true },
];

/** 메모 항목 */
export const COMMENT_ITEM = {
  icon: <MessageSquare size={ICON_SIZE} />, label: "새 메모", shortcut: "Ctrl+Alt+M", action: "insertComment",
};

/** 표 조작 하위메뉴 항목 */
export const TABLE_ITEMS = [
  { label: "행 추가 (위)", action: "addRowBefore" },
  { label: "행 추가 (아래)", action: "addRowAfter" },
  { label: "열 추가 (왼쪽)", action: "addColumnBefore" },
  { label: "열 추가 (오른쪽)", action: "addColumnAfter" },
  { dividerOnly: true },
  { label: "행 삭제", action: "deleteRow" },
  { label: "열 삭제", action: "deleteColumn" },
  { label: "셀 병합", action: "mergeCells" },
  { label: "셀 분할", action: "splitCell" },
  { dividerOnly: true },
  { label: "표 삭제", action: "deleteTable", danger: true },
];

/** 대화상자 항목 */
export const DIALOG_ITEMS = [
  { icon: <Type size={ICON_SIZE} />, label: "글꼴...", shortcut: "Ctrl+D", action: "fontDialog" },
  { icon: <Minus size={ICON_SIZE} />, label: "단락...", action: "paragraphDialog" },
];

/** 서식 지우기 항목 */
export const CLEAR_FORMAT_ITEM = {
  icon: <Paintbrush size={ICON_SIZE} />, label: "서식 지우기", action: "clearFormat", disabledKey: "noSelection",
};

/** 하위메뉴 부모 아이콘 */
export const SUBMENU_ICONS = {
  alignment: <AlignLeft size={ICON_SIZE} />,
  style: <Type size={ICON_SIZE} />,
  list: <List size={ICON_SIZE} />,
  table: <Table2 size={ICON_SIZE} />,
};
