/**
 * DialogField — 다이얼로그 공통 폼 필드 컴포넌트
 * label+input / label+select / 확인·취소 푸터 패턴 추출
 */

/**
 * 텍스트/숫자 입력 필드 (label + input)
 * @param {object} props
 * @param {string} props.label - 라벨 텍스트
 * @param {string|number} props.value - 현재 값
 * @param {function} props.onChange - 변경 콜백 (e => ...)
 * @param {string} [props.type="text"] - input 타입
 */
export function DialogField({ label, value, onChange, type = "text", ...props }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label className="word-dialog-label">{label}</label>
      <input
        className="word-dialog-input"
        type={type}
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  );
}

/**
 * 셀렉트 필드 (label + select)
 * @param {object} props
 * @param {string} props.label - 라벨 텍스트
 * @param {string|number} props.value - 선택 값
 * @param {function} props.onChange - 변경 콜백
 * @param {Array<{value:string,label:string}>} props.options - 옵션 배열
 * @param {object} [props.style] - select 스타일
 */
export function DialogSelect({ label, value, onChange, options, style }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label className="word-dialog-label">{label}</label>
      <select className="word-dialog-input" value={value} onChange={onChange} style={style}>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

/**
 * 다이얼로그 하단 버튼 영역
 * @param {object} props
 * @param {function} props.onOk - 확인 클릭
 * @param {function} props.onCancel - 취소 클릭
 * @param {string} [props.okLabel="확인"] - 확인 버튼 텍스트
 * @param {boolean} [props.disableOk=false] - 확인 버튼 비활성화
 * @param {React.ReactNode} [props.extraButtons] - 추가 버튼 (링크 제거 등)
 */
export function DialogFooter({ onOk, onCancel, okLabel = "확인", disableOk = false, extraButtons }) {
  return (
    <div className="word-dialog-footer">
      {extraButtons}
      <button className="word-dialog-btn" onClick={onCancel}>취소</button>
      <button className="word-dialog-btn primary" onClick={onOk} disabled={disableOk}>{okLabel}</button>
    </div>
  );
}
