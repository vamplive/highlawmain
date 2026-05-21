/**
 * 관리자 페이지 공통 페이지네이션 컴포넌트
 * — 6개 Admin 파일에서 중복되던 이전/다음 버튼을 단일 컴포넌트로 통합
 */
import { btnStyle } from "./styles";

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20 }}>
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={isFirst}
        style={{ ...btnStyle(isFirst ? "#ddd" : "#666"), padding: "6px 14px" }}
      >
        이전
      </button>
      <span style={{ fontSize: 13, color: "#666" }}>
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={isLast}
        style={{ ...btnStyle(isLast ? "#ddd" : "#666"), padding: "6px 14px" }}
      >
        다음
      </button>
    </div>
  );
}
