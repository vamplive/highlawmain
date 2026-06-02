/**
 * TableGridSelector — 표 그리드 선택기
 * 마우스로 행/열을 선택하여 표를 삽입하는 인터랙티브 그리드 UI
 */
import { useState } from "react";

/** 그리드 행/열 수 */
const GRID_ROWS = 8;
const GRID_COLS = 10;

/**
 * @param {object} props
 * @param {function} props.onSelect - (rows, cols) => void
 */
export default function TableGridSelector({ onSelect }) {
  const [hover, setHover] = useState({ row: 0, col: 0 });

  return (
    <div style={{ padding: 8 }}>
      <div style={{ fontSize: 11, color: "#555", marginBottom: 6, fontWeight: 500 }}>표 삽입</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_COLS}, 18px)`, gap: 1 }}>
        {Array.from({ length: GRID_ROWS * GRID_COLS }, (_, i) => {
          const r = Math.floor(i / GRID_COLS);
          const c = i % GRID_COLS;
          const active = r < hover.row && c < hover.col;
          return (
            <div key={i} className={`table-grid-cell${active ? " active" : ""}`}
              onMouseEnter={() => setHover({ row: r + 1, col: c + 1 })}
              onClick={() => onSelect(hover.row, hover.col)} />
          );
        })}
      </div>
      <div style={{ fontSize: 10, color: "#888", marginTop: 4, textAlign: "center" }}>
        {hover.row > 0 ? `${hover.row} × ${hover.col} 표` : "셀 위로 마우스를 이동하세요"}
      </div>
    </div>
  );
}
