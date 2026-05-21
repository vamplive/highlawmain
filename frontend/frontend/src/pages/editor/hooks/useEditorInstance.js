/**
 * useEditorInstance — TipTap 에디터 인스턴스 생성 및 확장 구성
 * EditorPage에서 사용하는 모든 TipTap 익스텐션을 한 곳에 모아 둠
 */
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Highlight } from "@tiptap/extension-highlight";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Link } from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { CharacterCount } from "@tiptap/extension-character-count";
import { FontFamily } from "@tiptap/extension-font-family";
import { Typography } from "@tiptap/extension-typography";

import {
  FontSize, LineSpacing, Indent, ParagraphSpacing,
  PageBreak, SectionBreak, ColumnBreak, LetterSpacing, TextShadow,
  TextBorder, ParagraphBorder, DropCap, KeepWithNext, WidowOrphan,
  Bookmark,
  TrackInsert, TrackDelete, TrackFormat, TrackChangesManager,
  PageNumberField, DateField, NonBreakingSpace, LineNumbers,
  ResizableImage,
} from "../modules/extensions";
import { CommentMark } from "../modules/comment-mark";
import { FootnoteReference } from "../modules/footnote-extension";
import { VisualPagination } from "../modules/pagination-extension";

/**
 * TipTap 에디터를 생성한다.
 * @param {object} options
 * @param {() => void} options.onAutoSave - onUpdate 시 호출될 자동 저장 트리거
 * @returns {import("@tiptap/react").Editor | null}
 */
export default function useEditorInstance({ onAutoSave }) {
  return useEditor({
    extensions: [
      // StarterKit v3는 link/underline을 기본 포함하므로 끄고,
      // textDirection은 끌 수 없어 우리 커스텀 확장을 제거하는 방식으로 회피한다(아래 주석 참고).
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: false,
        underline: false,
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Color,
      TextStyle,
      FontFamily,
      Typography,
      Link.configure({ openOnClick: false }),
      ResizableImage.configure({ allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder: "본문을 입력하세요..." }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      CharacterCount,
      FontSize,
      LineSpacing,
      Indent,
      ParagraphSpacing,
      PageBreak,
      SectionBreak,
      ColumnBreak,
      LetterSpacing,
      TextShadow,
      TextBorder,
      ParagraphBorder,
      DropCap,
      KeepWithNext,
      WidowOrphan,
      // TextDirection 은 StarterKit v3에 기본 포함되어 있어 커스텀 확장을 제거함
      Bookmark,
      FootnoteReference,
      CommentMark,
      TrackInsert,
      TrackDelete,
      TrackFormat,
      TrackChangesManager,
      PageNumberField,
      DateField,
      NonBreakingSpace,
      LineNumbers,
      VisualPagination,
    ],
    editable: true,
    /* ProseMirror의 기본 스크롤을 비활성화 — 페이지 갭을 모르기 때문에
       페이지네이션 전 위치(회색 갭 영역)로 스크롤하는 문제 방지.
       대신 applyPageBreaks 후 커스텀 scrollToCursor로 처리 */
    editorProps: {
      handleScrollToSelection: () => true,
    },
    onUpdate: () => onAutoSave?.(),
  });
}
