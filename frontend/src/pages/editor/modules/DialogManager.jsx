/**
 * DialogManager — 모든 다이얼로그를 dialogOpen 상태에 따라 조건부 렌더링하는 컴포넌트
 * EditorPage에서 분리된 다이얼로그 관리 영역 (15개 이상의 다이얼로그를 통합)
 */
import { memo } from "react";
import { FontDialog, ParagraphDialog, PageSetupDialog, HyperlinkDialog, TablePropertiesDialog as OrigTablePropsDialog, ImageDialog, ImageEditDialog } from "./Dialogs";
import { BorderShadingDialog, BookmarkDialog, CrossReferenceDialog, PageBorderDialog, WatermarkDialog } from "./NewDialogs";
import { PrintPreviewDialog, StylesManagerDialog, SymbolPickerDialog } from "./PrintPreviewDialog";
import { FootnoteEndnoteDialog } from "./FootnoteArea";

/**
 * @param {object} props
 * @param {string|null} props.dialogOpen - 현재 열린 다이얼로그 ID
 * @param {function} props.setDialogOpen - 다이얼로그 상태 변경 핸들러
 * @param {object} props.editor - TipTap 에디터 인스턴스
 * @param {object} props.layoutProps - 페이지 설정 다이얼로그용 레이아웃 속성
 * @param {object} props.pageProps - 페이지 테두리/워터마크 속성
 * @param {object} props.footnoteProps - 각주/미주 다이얼로그 속성
 * @param {object} props.printPreviewProps - 인쇄 미리보기 속성
 */
export const DialogManager = memo(function DialogManager({
  dialogOpen,
  setDialogOpen,
  editor,
  layoutProps,
  pageProps,
  footnoteProps,
  printPreviewProps,
}) {
  const closeDialog = () => setDialogOpen(null);

  if (!dialogOpen) return null;

  switch (dialogOpen) {
    case "font":
      return <FontDialog editor={editor} onClose={closeDialog} />;

    case "paragraph":
      return <ParagraphDialog editor={editor} onClose={closeDialog} />;

    case "pagesetup":
      return (
        <PageSetupDialog
          margins={layoutProps.margins} setMargins={layoutProps.setMargins}
          orientation={layoutProps.orientation} setOrientation={layoutProps.setOrientation}
          pageSize={layoutProps.pageSize} setPageSize={layoutProps.setPageSize}
          customMargins={layoutProps.customMargins} setCustomMargins={layoutProps.setCustomMargins}
          headerFooterSettings={layoutProps.headerFooterSettings}
          setHeaderFooterSettings={layoutProps.setHeaderFooterSettings}
          onClose={closeDialog}
        />
      );

    case "hyperlink":
      return <HyperlinkDialog editor={editor} onClose={closeDialog} />;

    case "table":
      return <OrigTablePropsDialog editor={editor} onClose={closeDialog} />;

    case "image":
      return <ImageDialog editor={editor} onClose={closeDialog} />;

    case "imageEdit": {
      const sel = editor?.state?.selection;
      const node = sel?.node;
      if (!node || node.type?.name !== "image") {
        closeDialog();
        return null;
      }
      const pos = sel.from;
      return (
        <ImageEditDialog
          image={{ src: node.attrs.src, alt: node.attrs.alt, width: node.attrs.width }}
          onApply={(next) => {
            editor.chain().focus().command(({ tr }) => {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...next });
              return true;
            }).run();
          }}
          onClose={closeDialog}
        />
      );
    }

    case "border":
      return <BorderShadingDialog editor={editor} onClose={closeDialog} />;

    case "bookmark":
      return <BookmarkDialog editor={editor} onClose={closeDialog} />;

    case "crossref":
      return <CrossReferenceDialog editor={editor} onClose={closeDialog} />;

    case "pageborder":
      return (
        <PageBorderDialog
          pageBorder={pageProps.pageBorder} setPageBorder={pageProps.setPageBorder}
          onClose={closeDialog}
        />
      );

    case "watermark":
      return (
        <WatermarkDialog
          watermarkText={pageProps.watermarkText} setWatermarkText={pageProps.setWatermarkText}
          onClose={closeDialog}
        />
      );

    case "printpreview":
      return (
        <PrintPreviewDialog
          editor={editor} onClose={closeDialog}
          onPrint={() => { window.print(); closeDialog(); }}
          pageW={printPreviewProps.pageW} pageH={printPreviewProps.pageH}
          marginTop={printPreviewProps.marginTop} marginBottom={printPreviewProps.marginBottom}
          marginLeft={printPreviewProps.marginLeft} marginRight={printPreviewProps.marginRight}
          footnotes={printPreviewProps.footnotes}
          footnoteNumberFormat={printPreviewProps.footnoteNumberFormat}
          endnotes={printPreviewProps.endnotes}
          endnoteNumberFormat={printPreviewProps.endnoteNumberFormat}
          drawings={printPreviewProps.drawings}
        />
      );

    case "stylesmanager":
      return (
        <StylesManagerDialog
          onClose={closeDialog}
          onApplyStyle={(style) => {
            if (style.tag === "blockquote") editor?.chain().focus().toggleBlockquote().run();
            else if (style.tag?.startsWith("h")) editor?.chain().focus().toggleHeading({ level: parseInt(style.tag[1]) }).run();
            else editor?.chain().focus().setParagraph().run();
          }}
        />
      );

    case "symbol":
      return <SymbolPickerDialog editor={editor} onClose={closeDialog} />;

    case "footnoteendnote":
      return (
        <FootnoteEndnoteDialog
          onInsert={footnoteProps.handleFootnoteDialogInsert}
          onClose={closeDialog}
          numberFormat={footnoteProps.footnoteNumberFormat}
          setNumberFormat={footnoteProps.setFootnoteNumberFormat}
          endnoteNumberFormat={footnoteProps.endnoteNumberFormat}
          setEndnoteNumberFormat={footnoteProps.setEndnoteNumberFormat}
        />
      );

    default:
      return null;
  }
});
