/**
 * 관리자 편집 패널 — 인라인 폼 컨테이너
 * — "생성/수정" 패턴을 통합 (formContainerStyle + 제목 + 저장/취소)
 */
import { formContainerStyle, btnStyle, COLORS } from "./styles";

export default function EditPanel({ isNew, entityName, onSave, onCancel, children }) {
  return (
    <div style={formContainerStyle}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: COLORS.text }}>
        {isNew ? `새 ${entityName} 등록` : `${entityName} 수정`}
      </h3>

      {children}

      <div className="flex gap-3" style={{ marginTop: 16 }}>
        <button onClick={onSave} style={btnStyle()}>저장</button>
        <button onClick={onCancel} style={btnStyle(COLORS.muted)}>취소</button>
      </div>
    </div>
  );
}
