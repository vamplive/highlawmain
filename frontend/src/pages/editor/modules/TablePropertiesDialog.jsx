/**
 * TablePropertiesDialog (원본) — 표 삽입/편집 대화상자
 * 새 표 삽입 또는 기존 표의 행/열 추가·삭제, 셀 병합/분할을 처리한다.
 * DialogManager에서 OrigTablePropsDialog로 import된다.
 */
import { useState } from "react";
import { DialogShell } from "./DialogShell";
import { DialogFooter } from "./DialogField";

export function TablePropertiesDialog({ editor, onClose }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  return (
    <DialogShell title="표 속성" onClose={onClose} width={400}>
      <div className="word-dialog-body">
        {editor?.isActive("table") ? (
          <>
            <div style={{ fontSize: 12, marginBottom: 12 }}>현재 표가 선택되어 있습니다.</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="word-dialog-btn" onClick={() => { editor.chain().focus().addRowAfter().run(); }}>행 추가 (아래)</button>
              <button className="word-dialog-btn" onClick={() => { editor.chain().focus().addRowBefore().run(); }}>행 추가 (위)</button>
              <button className="word-dialog-btn" onClick={() => { editor.chain().focus().addColumnAfter().run(); }}>열 추가 (오른쪽)</button>
              <button className="word-dialog-btn" onClick={() => { editor.chain().focus().addColumnBefore().run(); }}>열 추가 (왼쪽)</button>
              <button className="word-dialog-btn" onClick={() => { editor.chain().focus().deleteRow().run(); }}>행 삭제</button>
              <button className="word-dialog-btn" onClick={() => { editor.chain().focus().deleteColumn().run(); }}>열 삭제</button>
              <button className="word-dialog-btn" onClick={() => { editor.chain().focus().mergeCells().run(); }}>셀 병합</button>
              <button className="word-dialog-btn" onClick={() => { editor.chain().focus().splitCell().run(); }}>셀 분할</button>
              <button className="word-dialog-btn" style={{ color: "#c00" }} onClick={() => { editor.chain().focus().deleteTable().run(); onClose(); }}>표 삭제</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label className="word-dialog-label">행 수:</label>
                <input type="number" className="word-dialog-input" value={rows} onChange={e => setRows(parseInt(e.target.value) || 1)} min={1} max={50} />
              </div>
              <div>
                <label className="word-dialog-label">열 수:</label>
                <input type="number" className="word-dialog-input" value={cols} onChange={e => setCols(parseInt(e.target.value) || 1)} min={1} max={20} />
              </div>
            </div>
            <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" defaultChecked /> 머리글 행 포함
            </label>
          </>
        )}
      </div>
      {!editor?.isActive("table") ? (
        <DialogFooter
          onOk={() => { editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run(); onClose(); }}
          onCancel={onClose}
          okLabel="삽입"
        />
      ) : (
        <div className="word-dialog-footer">
          <button className="word-dialog-btn" onClick={onClose}>취소</button>
        </div>
      )}
    </DialogShell>
  );
}
