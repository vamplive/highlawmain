/**
 * 관리자 폼 필드 컴포넌트
 * — label + input/select/textarea 조합을 단일 컴포넌트로 통합
 * — 11개 Admin 파일에서 반복되던 label + fieldStyle 패턴 제거
 */
import { fieldStyle, labelStyle } from "./styles";

/**
 * @param {string} label - 필드 라벨
 * @param {string} value - 현재 값
 * @param {function} onChange - 값 변경 콜백 (value를 직접 전달)
 * @param {string} type - "text" | "number" | "email" | "password" | "textarea" | "select"
 * @param {string} placeholder - 플레이스홀더
 * @param {boolean} required - 라벨에 * 표시
 * @param {boolean} disabled - 비활성화
 * @param {Array} options - select 타입일 때 [{value, label}] 배열
 * @param {number} minHeight - textarea 최소 높이
 * @param {object} style - 추가 스타일 오버라이드
 */
export default function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  disabled = false,
  options = [],
  minHeight = 80,
  style: extraStyle = {},
  children,
}) {
  const handleChange = (e) => onChange(type === "number" ? Number(e.target.value) : e.target.value);

  return (
    <div>
      {label && (
        <label style={labelStyle}>
          {label}{required && " *"}
        </label>
      )}

      {type === "textarea" ? (
        <textarea
          style={{ ...fieldStyle, minHeight, resize: "vertical", ...extraStyle }}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
        />
      ) : type === "select" ? (
        <select
          style={{ ...fieldStyle, ...extraStyle }}
          value={value}
          onChange={handleChange}
          disabled={disabled}
        >
          {children || options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          style={{ ...fieldStyle, ...extraStyle }}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}
    </div>
  );
}
